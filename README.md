# Chart.js データ視覚化チュートリアル

世界銀行オープンデータを [Chart.js](https://www.chartjs.org/) で可視化するサンプル集です。
各サンプルの JS ファイル先頭にある `CONFIG` を書き換えるだけで、別の指標・国・年のデータに入れ替えられます。

## 動かし方

ビルドは不要です。**`index.html` をブラウザで直接開くだけで動きます** (`file://` で問題ありません)。

ローカルサーバー経由でも動かせます。

```sh
# このリポジトリのルートで実行 (Python 3 の場合)
python3 -m http.server 8000
```

ブラウザで http://localhost:8000/ を開くと、サンプル一覧ページ (`index.html`) が表示されます。

> 直接開いて動くのは、通常の `<script>` タグと CORS 許可済みの外部 API のみを使っているためです。
> 改造して ES モジュール (`import`) やローカル JSON の `fetch` を使う場合は、サーバー経由が必要になります。

## ファイル構成

```
├── index.html                # サンプル一覧ページ
├── style.css                 # 全サンプル共通のスタイル
├── js/
│   └── worldbank.js          # World Bank API 取得ユーティリティ (共通)
└── samples/
    ├── line.html / line.js       # 折れ線: 人口推移の複数国比較
    ├── bar.html / bar.js         # 棒: 特定年の GDP を国別比較
    ├── pie.html / pie.js         # ドーナツ: 特定年の GDP シェア
    └── scatter.html / scatter.js # 散布図: 一人当たり GDP × 平均寿命
```

## World Bank API の基本

世界銀行は各国の統計データを無料の REST API で公開しています。API キーは不要です。

```
https://api.worldbank.org/v2/country/{国コード}/indicator/{指標コード}?format=json&date=2000:2023
```

- **国コード**: ISO2 (`JP`, `US`) または ISO3 (`JPN`, `USA`)。複数国は `;` 区切り (`JP;US;CN`)
- **指標コード**: `SP.POP.TOTL` のような ID。[指標一覧](https://data.worldbank.org/indicator) から調べられます。各指標ページの URL の末尾がそのコードです
- **format=json**: JSON 形式で取得
- **date=2000:2023**: 取得期間

この API 呼び出しは `js/worldbank.js` の `WorldBank.fetchIndicator()` にまとめてあり、
`null` の除外と年昇順ソートまで行った配列を返します。
各行には指標の正式名称 (英語、例: `Population, total`) も `indicator` フィールドに含まれており、
各サンプルではこの名前をページ説明やチャートタイトルに `SP.POP.TOTL (Population, total)` のように併記しています。
`CONFIG` の指標コードを書き換えると、表示名も自動的に変わります。

### よく使う指標コード

| 指標コード | 内容 |
|---|---|
| `SP.POP.TOTL` | 総人口 |
| `NY.GDP.MKTP.CD` | GDP (米ドル) |
| `NY.GDP.PCAP.CD` | 一人当たり GDP (米ドル) |
| `SP.DYN.LE00.IN` | 平均寿命 |
| `SP.URB.TOTL.IN.ZS` | 都市人口割合 (%) |
| `EN.ATM.CO2E.PC` | 一人当たり CO2 排出量 |
| `SE.XPD.TOTL.GD.ZS` | 教育支出 (対 GDP %) |
| `SL.UEM.TOTL.ZS` | 失業率 (%) |

## データの入れ替え方

各サンプルの JS ファイル先頭にある `CONFIG` オブジェクトを書き換えるだけです。
たとえば `samples/line.js` で都市人口割合の推移を G7 各国で見たい場合:

```js
const CONFIG = {
  indicator: 'SP.URB.TOTL.IN.ZS',                      // 指標を変更
  countries: ['JP', 'US', 'GB', 'FR', 'DE', 'IT', 'CA'], // 国を変更
  startYear: 1990,
  endYear: 2023,
};
```

変更してブラウザを再読み込みするだけで、新しいデータのグラフが表示されます。

## 各サンプルの解説

### 1. 折れ線グラフ (`samples/line.js`)

時系列データの基本形。複数国のデータを国ごとの `datasets` に分け、
欠損年は `spanGaps: true` で線をつないでいます。
ツールチップは `interaction: { mode: 'index' }` で同年の全国分をまとめて表示します。

### 2. 棒グラフ (`samples/bar.js`)

特定の 1 年分だけを取得 (`startYear` と `endYear` に同じ年を指定) し、
国別に棒で並べます。その年にデータがない国は自動的に除外されます。

### 3. ドーナツグラフ (`samples/pie.js`)

棒グラフと同じデータを構成比として表示します。
ツールチップのコールバックで、値と全体に占める割合 (%) を併記しています。

### 4. 散布図 (`samples/scatter.js`)

2 つの指標を `Promise.all` で並行取得し、国コードをキーに突き合わせて
`{x, y}` の点に変換します。両方のデータが存在する国だけがプロットされます。
軸ラベル (`scales.x.title`) やツールチップのカスタマイズ例も入っています。

## よくあるエラーと対処

- **「データを取得できませんでした。指標コード … を確認してください」**
  指標コードまたは国コードが間違っています。[指標一覧](https://data.worldbank.org/indicator) で正しいコードを確認してください。
- **「○○ 年のデータがありません」**
  その年はデータが未公表です。`year` を 1〜2 年ずらしてください (最新年のデータは遅れて公表されることがあります)。
- **グラフが真っ白で何も表示されない**
  Chart.js の CDN 読み込みと World Bank API へのアクセスの両方にインターネット接続が必要です。
  ブラウザの開発者ツール (コンソール / ネットワーク) でエラーを確認してください。
  また、API の応答が遅いと表示まで時間がかかることがあります (10 秒以上待ってから再読み込み)。

## データの出典

[World Bank Open Data](https://data.worldbank.org/) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))
