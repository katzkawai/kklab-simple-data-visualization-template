/**
 * 棒グラフのサンプル: 特定の年の指標を国別に比較する。
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicator: 'NY.GDP.MKTP.CD',                    // 指標コード (例: GDP・米ドル)
  countries: ['JP', 'US', 'CN', 'DE', 'IN'],      // 国コード (ISO2 または ISO3、複数可)
  year: 2022,   // 比較する年 (その年にデータがない国は自動で除外される)
};

async function main() {
  // 指定した 1 年分だけ取得する
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

  new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.country),
      datasets: [{
        label: `${indicatorName} (${CONFIG.year})`,
        data: rows.map((r) => r.value),
        backgroundColor: '#2b6cb0',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `${indicatorName} 国別比較 (${CONFIG.year})` },
        legend: { display: false },
      },
      scales: {
        y: { ticks: { callback: (v) => v.toLocaleString() } },
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
