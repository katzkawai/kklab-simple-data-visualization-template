/**
 * ドーナツグラフのサンプル: 特定の年の指標を国別シェアで表示する。
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicator: 'NY.GDP.MKTP.CD',                // 指標コード (例: GDP・米ドル)
  countries: ['JP', 'US', 'CN', 'DE', 'IN'],  // 国コード (ISO2 または ISO3、複数可)
  year: 2022,   // 対象年
};

const COLORS = ['#2b6cb0', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];

async function main() {
  const rows = await WorldBank.fetchIndicator(CONFIG.countries, CONFIG.indicator, {
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

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  new Chart(document.getElementById('chart'), {
    type: 'doughnut',
    data: {
      labels: rows.map((r) => r.country),
      datasets: [{
        data: rows.map((r) => r.value),
        backgroundColor: COLORS.slice(0, rows.length),
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `${indicatorName} のシェア (${CONFIG.year})` },
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            // ツールチップに値とシェア (%) を併記する
            label: (ctx) =>
              ` ${ctx.parsed.toLocaleString()} (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
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
