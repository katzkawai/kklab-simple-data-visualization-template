/**
 * ドーナツグラフのサンプル: 世界全体に占める国別シェアを年代別に並べて表示する。
 *
 * ドーナツ (円) グラフは「全体に対する部分」を表すグラフなので、
 * 全要素の合計が意味のある全体になるデータを使う必要がある。
 * このサンプルでは世界全体 (WLD) の値も取得し、選択国以外を
 * 「その他」として残差で加えることで、合計が世界総計と一致するようにしている。
 *
 * 最新のデータがある年から interval 年間隔で遡り、新しい年から順に
 * 複数のドーナツグラフを 3 列のグリッドで描画する。
 *
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicator: 'NY.GDP.MKTP.CD',                // 指標コード (例: GDP・米ドル)
  countries: ['US', 'CN', 'JP', 'DE', 'IN'],  // 国コード (ISO2 または ISO3、複数可)
  startYear: 2000,  // この年頃まで遡る
  interval: 3,      // この年数間隔でグラフを作成する
};

const COLORS = ['#2b6cb0', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];
const OTHER_COLOR = '#a0aec0'; // 「その他」の色 (グレー)

async function main() {
  // 世界全体 (WLD) と選択国をまとめて、startYear から最新まで取得する
  const rows = await WorldBank.fetchIndicator(['WLD', ...CONFIG.countries], CONFIG.indicator, {
    startYear: CONFIG.startYear,
    endYear: new Date().getFullYear(),
  });

  if (rows.length === 0) {
    throw new Error('データがありません。指標コード・国コード・期間を確認してください。');
  }

  // 指標の正式名称をコードに併記する
  const indicatorName = rows[0].indicator;
  document.getElementById('indicator-label').textContent =
    `${CONFIG.indicator} (${indicatorName})`;

  const worldRows = rows.filter((r) => r.countryCode === 'WLD');
  if (worldRows.length === 0) {
    throw new Error('世界全体 (WLD) のデータがありません。');
  }

  // WLD のデータがある最新年から interval 年間隔で遡る年の一覧 (新しい順)
  const latestYear = Math.max(...worldRows.map((r) => r.year));
  const years = [];
  for (let y = latestYear; y >= CONFIG.startYear; y -= CONFIG.interval) {
    years.push(y);
  }

  // 国ごとに色を固定する (全グラフで同じ国は同じ色)
  const seen = new Map(); // countryCode -> country 名
  rows.forEach((r) => {
    if (r.countryCode !== 'WLD' && !seen.has(r.countryCode)) seen.set(r.countryCode, r.country);
  });
  const countryList = [...seen.entries()].map(([code, country], i) => ({
    code,
    country,
    color: COLORS[i % COLORS.length],
  }));

  // 共有の凡例をページ上部に作る (各グラフには凡例を付けない)
  const legend = document.getElementById('legend');
  [...countryList.map((c) => ({ name: c.country, color: c.color })), { name: 'その他', color: OTHER_COLOR }]
    .forEach(({ name, color }) => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.background = color;
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(name));
      legend.appendChild(item);
    });

  // 年ごとにドーナツグラフを描画する (新しい年から順に)
  const grid = document.getElementById('charts');
  years.forEach((year) => {
    const world = worldRows.find((r) => r.year === year);
    if (!world) return;

    const countryRows = countryList
      .map((c) => ({ ...c, row: rows.find((r) => r.countryCode === c.code && r.year === year) }))
      .filter((c) => c.row);

    // 「その他」= 世界総計 − 選択国の合計。これで全要素の合計が世界総計と一致する
    const restValue = world.value - countryRows.reduce((sum, c) => sum + c.row.value, 0);

    const slices = countryRows.map((c) => ({ label: c.country, value: c.row.value, color: c.color }));
    if (restValue > 0) {
      slices.push({ label: 'その他', value: restValue, color: OTHER_COLOR });
    }

    const cell = document.createElement('div');
    cell.className = 'chart-cell';
    const canvas = document.createElement('canvas');
    cell.appendChild(canvas);
    grid.appendChild(cell);

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: slices.map((s) => s.label),
        datasets: [{
          data: slices.map((s) => s.value),
          backgroundColor: slices.map((s) => s.color),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: `${year} 年` },
          legend: { display: false }, // 凡例はページ上部の共有のものを使う
          tooltip: {
            callbacks: {
              // ツールチップに国名・値・世界総計に占める割合 (%) を併記する
              label: (ctx) =>
                ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / world.value) * 100).toFixed(1)}%)`,
            },
          },
        },
      },
    });
  });

  document.getElementById('status').remove();
}

main().catch((err) => {
  const status = document.getElementById('status');
  status.className = 'status error';
  status.textContent = `エラー: ${err.message}`;
});
