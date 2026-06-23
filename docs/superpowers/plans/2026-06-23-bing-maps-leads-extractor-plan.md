# Bing Maps Leads Extractor 実装計画

1. `extensions/bing-maps-leads-extractor` にManifest V3拡張を作る。
2. 純粋関数として文字列正規化、座標解析、重複判定、詳細画面解析を実装する。
3. Shadow DOMのサイドパネルと、開始・一時停止・再開・停止の状態機械を実装する。
4. 検索結果候補の検出、自動スクロール、詳細画面の待機と再試行を実装する。
5. `chrome.storage.local` に状態と結果を保存し、再読み込み後に復元する。
6. Background Service WorkerでUTF-8 CSVとExcel互換`.xlsx`を生成してダウンロードする。
7. Node標準テストで純粋関数と出力を検証し、Chromeへの読み込み手順をREADMEへ記載する。

