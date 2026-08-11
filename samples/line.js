/**
 * 折れ線グラフのサンプル: 複数国の指標を時系列で比較する。
 * データを変えたいときは、下の CONFIG だけを書き換えればよい。
 */
const CONFIG = {
  indicator: 'SP.POP.TOTL',        // 指標コード (例: 総人口)
  countries: ['JP', 'US', 'CN'],   // 国コード (ISO2 または ISO3、複数可)
  startYear: 2000,
  endYear: 2023,
};

// 国ごとの線の色 (国の数だけ先頭から使われる)
const COLORS = ['#2b6cb0', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];

async function main() {
  document.getElementById('indicator-label').textContent = CONFIG.indicator;

  const rows = await WorldBank.fetchIndicator(CONFIG.countries, CONFIG.indicator, {
    startYear: CONFIG.startYear,
    endYear: CONFIG.endYear,
  });

  // 取得した年の一覧 (横軸のラベル)
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  // 国ごとにデータセットを組み立てる
  const countryNames = [...new Map(rows.map((r) => [r.countryCode, r.country])).entries()];
  const datasets = countryNames.map(([code, name], i) => ({
    label: name,
    data: years.map((y) => {
      const row = rows.find((r) => r.countryCode === code && r.year === y);
      return row ? row.value : null;
    }),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length],
    tension: 0.2,
    spanGaps: true, // 欠損年があっても線をつなぐ
  }));

  new Chart(document.getElementById('chart'), {
    type: 'line',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: { display: true, text: `${CONFIG.indicator} (${CONFIG.startYear}〜${CONFIG.endYear})` },
        legend: { position: 'top' },
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
