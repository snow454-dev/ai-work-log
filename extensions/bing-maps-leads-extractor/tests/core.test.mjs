import test from "node:test";
import assert from "node:assert/strict";

await import("../core.js");
const Core = globalThis.BingLeadsCore;

test("Bing Maps URLから座標を抽出する", () => {
  assert.deepEqual(
    Core.coordinateFromUrl("https://www.bing.com/maps?cp=35.681236~139.767125&lvl=16"),
    { latitude: "35.681236", longitude: "139.767125" }
  );
});

test("Bing Mapsのypidを一意キーに使う", () => {
  const lead = {
    ...Core.emptyLead(),
    bingMapsUrl: "https://www.bing.com/maps/search?q=x&sece=ypid%3AYN123ABC&cp=35~139"
  };
  assert.equal(Core.leadKey(lead), "map:YN123ABC");
});

test("検索結果見出しを検索カテゴリとして優先する", () => {
  assert.equal(Core.inferSearchCategory("リフォーム", "江別 リフォーム"), "リフォーム");
});

test("見出しがない場合は検索語の末尾を検索カテゴリにする", () => {
  assert.equal(Core.inferSearchCategory("", "江別 リフォーム"), "リフォーム");
});

test("店名と住所で重複を除去する", () => {
  const input = [
    { ...Core.emptyLead(), name: "株式会社 テスト", address: "東京都 千代田区 1-1" },
    { ...Core.emptyLead(), name: "株式会社　テスト", address: "東京都 千代田区 1-1" }
  ];
  assert.equal(Core.dedupeLeads(input).length, 1);
});

test("電話番号の記号差を吸収してキーを作る", () => {
  const a = { ...Core.emptyLead(), name: "Example", phone: "03-1234-5678" };
  const b = { ...Core.emptyLead(), name: "Example", phone: "0312345678" };
  assert.equal(Core.leadKey(a), Core.leadKey(b));
});

test("スプレッドシート数式として解釈される値を無害化する", () => {
  assert.equal(Core.sanitizeSpreadsheetCell("=HYPERLINK(\"x\")"), "'=HYPERLINK(\"x\")");
  assert.equal(Core.sanitizeSpreadsheetCell("普通の値"), "普通の値");
});
