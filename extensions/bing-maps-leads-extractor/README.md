# Bing Maps Leads Extractor

Bing Mapsの検索結果から、画面に表示される事業者情報を最大500件まで取得する社内利用向けChrome拡張機能です。外部サーバーやAPIキーは使いません。

## インストール

1. Chromeで `chrome://extensions` を開く。
2. 右上の「デベロッパーモード」を有効にする。
3. 「パッケージ化されていない拡張機能を読み込む」を選ぶ。
4. この `bing-maps-leads-extractor` フォルダを選ぶ。

更新時は `chrome://extensions` で本拡張の再読み込みボタンを押し、開いているBing Mapsも再読み込みしてください。

## 使い方

1. `https://www.bing.com/maps` を開く。
2. 地域と業種を検索する。
3. 右上の「Leads Extractor」で最大件数を指定する。
4. 「取得開始」を押す。
5. 完了後にCSVまたはExcelを押して保存する。

処理中はBing Mapsのタブを閉じないでください。一時停止・停止後も取得済みデータはブラウザ内に残ります。

## 取得項目

店名、カテゴリ、住所、電話番号、Webサイト、メールアドレス、SNS、緯度、経度、評価、口コミ数、画像URL、Bing Maps URL。

Bing Mapsに表示されない項目は空欄になります。企業Webサイトは巡回しません。

## 注意事項

- Bing Mapsの画面構造が変わると、`core.js`または`content.js`のセレクター調整が必要です。
- 大量・高速な自動操作は避け、Bing Mapsの利用条件と適用法令を確認してください。
- 本拡張は同時並列でアクセスせず、店舗を1件ずつ処理します。

## 開発時の確認

```bash
cd extensions/bing-maps-leads-extractor
npm test
npm run check
```
