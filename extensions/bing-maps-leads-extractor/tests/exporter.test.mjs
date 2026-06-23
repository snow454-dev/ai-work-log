import test from "node:test";
import assert from "node:assert/strict";
import { createCsv, createXlsx } from "../exporter.js";

const lead = {
  name: "テスト株式会社",
  category: "IT",
  address: "東京都",
  phone: "03-1234-5678",
  website: "https://example.com",
  email: "",
  social: "",
  latitude: "35.0",
  longitude: "139.0",
  rating: "4.5",
  reviewCount: "12",
  imageUrl: "",
  bingMapsUrl: "https://www.bing.com/maps"
};

test("CSVはBOMと日本語ヘッダーを含む", () => {
  const csv = createCsv([lead]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.match(csv, /"店名"/);
  assert.match(csv, /"テスト株式会社"/);
});

test("XLSXはZIPシグネチャを持つ", () => {
  const xlsx = createXlsx([lead]);
  assert.equal(xlsx[0], 0x50);
  assert.equal(xlsx[1], 0x4B);
  assert.ok(xlsx.length > 500);
});

