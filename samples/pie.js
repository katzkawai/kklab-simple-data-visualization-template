/**
 * ドーナツグラフのサンプル: 特定の年の指標について、世界全体に占める国別シェアを表示する。
 *
 * ドーナツ (円) グラフは「全体に対する部分」を表すグラフなので、
 * 全要素の合計が意味のある全体になるデータを使う必要がある。
 * このサンプルでは世界全体 (WLD) の値も取得し、選択国以外を
 * 「その他」として残差で加えることで、合計が世界総計と一致するようにしている。
 *
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicator: 'NY.GDP.MKTP.CD',                // 指標コード (例: GDP・米ドル)
  countries: ['US', 'CN', 'JP', 'DE', 'IN'],  // 国コード (ISO2 または ISO3、複数可)
  year: 2022,   // 対象年
};

const COLORS = ['#2b6cb0', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];
const OTHER_COLOR = '#a0aec0'; // 「その他」の色 (グレー)

async function main() {
  // 世界全体 (WLD) と選択国をまとめて取得する
  const rows = await WorldBank.fetchIndicator(['WLD', ...CONFIG.countries], CONFIG.indicator, {
    startYear: CONFIG.year,
    endYear: CONFIG.year,
  });

  if (rows.length === 0) {
    throw new Error(`${CONFIG.year} 年のデータがありません。year を変更してください。`);
  }

  // 指標の正式名称をコードに併記する
  const indicatorName = rows[0].indicator;
  document.getElementById('indicator-label').textContent =
    `${CONFIG.indicator} (${indicatorName})`;

  const worldRow = rows.find((r) => r.countryCode === 'WLD');
  if (!worldRow) {
    throw new Error('世界全体 (WLD) のデータがありません。year を変更してください。');
  }

  const countries = rows.filter((r) => r.countryCode !== 'WLD');

  // 「その他」= 世界総計 − 選択国の合計。これで全要素の合計が世界総計と一致する
  const restValue = worldRow.value - countries.reduce((sum, r) => sum + r.value, 0);
  const slices = [...countries];
  if (restValue > 0) {
    slices.push({ country: 'その他', value: restValue });
  }

  new Chart(document.getElementById('chart'), {
    type: 'doughnut',
    data: {
      labels: slices.map((r) => r.country),
      datasets: [{
        data: slices.map((r) => r.value),
        backgroundColor: slices.map((_, i) => (i < countries.length ? COLORS[i % COLORS.length] : OTHER_COLOR)),
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `世界の ${indicatorName} に占めるシェア (${CONFIG.year})` },
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            // ツールチップに値と世界総計に占める割合 (%) を併記する
            label: (ctx) =>
              ` ${ctx.parsed.toLocaleString()} (${((ctx.parsed / worldRow.value) * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });

  document.getElementById('status').remove();
}

main().catch((err) => {
  const status = document.getElementById('status');
  status.className = 'status error';
  status.textContent = `エラー: ${err.message}`;
});
