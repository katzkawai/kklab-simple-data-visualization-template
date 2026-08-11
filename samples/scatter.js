/**
 * 散布図のサンプル: 2 つの指標の関係を国ごとにプロットする。
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicatorX: 'NY.GDP.PCAP.CD',  // 横軸の指標 (例: 一人当たり GDP・米ドル)
  indicatorY: 'SP.DYN.LE00.IN',  // 縦軸の指標 (例: 平均寿命)
  countries: [
    'JP', 'US', 'CN', 'DE', 'IN', 'BR', 'NG', 'FR', 'GB', 'KR',
    'ID', 'MX', 'RU', 'ZA', 'AU', 'CA', 'IT', 'ES', 'TR', 'SA',
  ],
  year: 2021,   // 対象年 (2 指標ともデータがある国だけプロットされる)
};

async function main() {
  document.getElementById('indicator-x-label').textContent = CONFIG.indicatorX;
  document.getElementById('indicator-y-label').textContent = CONFIG.indicatorY;

  // 2 つの指標を並行して取得する
  const [rowsX, rowsY] = await Promise.all([
    WorldBank.fetchIndicator(CONFIG.countries, CONFIG.indicatorX, {
      startYear: CONFIG.year, endYear: CONFIG.year,
    }),
    WorldBank.fetchIndicator(CONFIG.countries, CONFIG.indicatorY, {
      startYear: CONFIG.year, endYear: CONFIG.year,
    }),
  ]);

  // 国コードをキーに縦軸の値を引けるようにする
  const yByCountry = new Map(rowsY.map((r) => [r.countryCode, r.value]));

  // 両方の指標にデータがある国だけ {x, y} に変換
  const points = rowsX
    .filter((r) => yByCountry.has(r.countryCode))
    .map((r) => ({ x: r.value, y: yByCountry.get(r.countryCode), country: r.country }));

  if (points.length === 0) {
    throw new Error(`${CONFIG.year} 年に両指標のデータがある国がありません。year を変更してください。`);
  }

  new Chart(document.getElementById('chart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${CONFIG.indicatorY} vs ${CONFIG.indicatorX} (${CONFIG.year})`,
        data: points,
        backgroundColor: '#2b6cb0',
        pointRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `${CONFIG.indicatorY} vs ${CONFIG.indicatorX} (${CONFIG.year})` },
        legend: { display: false },
        tooltip: {
          callbacks: {
            // ツールチップに国名と両方の値を表示する
            label: (ctx) =>
              `${ctx.raw.country}: x=${ctx.parsed.x.toLocaleString()}, y=${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: CONFIG.indicatorX } },
        y: { title: { display: true, text: CONFIG.indicatorY } },
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
