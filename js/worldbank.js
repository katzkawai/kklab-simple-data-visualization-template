/**
 * worldbank.js
 * 世界銀行オープンデータ API から指標データを取得する共通ユーティリティ。
 *
 * API ドキュメント: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 *
 * 使い方:
 *   const rows = await WorldBank.fetchIndicator(['JP', 'US'], 'SP.POP.TOTL', {
 *     startYear: 2000,
 *     endYear: 2023,
 *   });
 *   // rows = [{ countryCode: 'JPN', country: 'Japan', year: 2000, value: 126... }, ...]
 */
const WorldBank = (() => {
  const BASE_URL = 'https://api.worldbank.org/v2';

  /**
   * 指定した国・指標の時系列データを取得する。
   *
   * @param {string|string[]} countryCodes 国コード (ISO2: 'JP' / ISO3: 'JPN')。複数国は配列で。
   * @param {string} indicatorId 指標コード (例: 'SP.POP.TOTL')
   * @param {{startYear?: number, endYear?: number}} [options] 取得期間 (既定: 2000〜最新)
   * @returns {Promise<Array<{countryCode: string, country: string, year: number, value: number}>>}
   *   年昇順・値が null の行は除外済みの配列
   */
  async function fetchIndicator(countryCodes, indicatorId, options = {}) {
    const { startYear = 2000, endYear = new Date().getFullYear() } = options;
    const codes = (Array.isArray(countryCodes) ? countryCodes : [countryCodes]).join(';');
    const url =
      `${BASE_URL}/country/${codes}/indicator/${indicatorId}` +
      `?format=json&date=${startYear}:${endYear}&per_page=1000`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`World Bank API エラー: HTTP ${response.status} (${url})`);
    }

    const json = await response.json();
    // 正常時は [meta, data] の 2 要素配列。指標コードが無効だとエラーオブジェクトが返る。
    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
      throw new Error(
        `データを取得できませんでした。指標コード "${indicatorId}" や国コード "${codes}" を確認してください。`
      );
    }

    return json[1]
      .filter((row) => row.value !== null)
      .map((row) => ({
        countryCode: row.countryiso3code || row.country.id,
        country: row.country.value,
        year: Number(row.date),
        value: row.value,
      }))
      .sort((a, b) => a.year - b.year);
  }

  return { fetchIndicator };
})();

// Node.js での動作確認用 (ブラウザでは無視される)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldBank;
}
