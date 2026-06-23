const COLUMNS = [
  ["searchCategory", "検索カテゴリ"],
  ["name", "店名"],
  ["category", "カテゴリ"],
  ["address", "住所"],
  ["phone", "電話番号"],
  ["website", "Webサイト"],
  ["email", "メールアドレス"],
  ["social", "SNS"],
  ["latitude", "緯度"],
  ["longitude", "経度"],
  ["rating", "評価"],
  ["reviewCount", "口コミ数"],
  ["imageUrl", "画像URL"],
  ["bingMapsUrl", "Bing Maps URL"]
];

export const sanitizeCell = (value) => {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const csvEscape = (value) => `"${sanitizeCell(value).replace(/"/g, '""')}"`;

export const createCsv = (leads) => {
  const rows = [
    COLUMNS.map(([, label]) => csvEscape(label)).join(","),
    ...leads.map((lead) =>
      COLUMNS.map(([key]) => csvEscape(lead[key])).join(",")
    )
  ];
  return `\uFEFF${rows.join("\r\n")}`;
};

const xmlEscape = (value) =>
  sanitizeCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const columnName = (index) => {
  let output = "";
  for (let current = index + 1; current > 0; current = Math.floor((current - 1) / 26)) {
    output = String.fromCharCode(65 + ((current - 1) % 26)) + output;
  }
  return output;
};

const worksheetXml = (leads) => {
  const rows = [
    COLUMNS.map(([, label]) => label),
    ...leads.map((lead) => COLUMNS.map(([key]) => lead[key] ?? ""))
  ];
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
};

const encoder = new TextEncoder();
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[i] = value >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const u16 = (value) => new Uint8Array([value & 0xFF, (value >>> 8) & 0xFF]);
const u32 = (value) => new Uint8Array([
  value & 0xFF,
  (value >>> 8) & 0xFF,
  (value >>> 16) & 0xFF,
  (value >>> 24) & 0xFF
]);

const concat = (parts) => {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const zipStore = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034B50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
      name, data
    ]);
    localParts.push(local);
    centralParts.push(concat([
      u32(0x02014B50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]));
    offset += local.length;
  }

  const central = concat(centralParts);
  const end = concat([
    u32(0x06054B50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(offset), u16(0)
  ]);
  return concat([...localParts, central, end]);
};

export const createXlsx = (leads) => zipStore([
  {
    name: "[Content_Types].xml",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  },
  {
    name: "_rels/.rels",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  },
  {
    name: "xl/workbook.xml",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Bing Maps Leads" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  },
  {
    name: "xl/_rels/workbook.xml.rels",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  },
  { name: "xl/worksheets/sheet1.xml", data: worksheetXml(leads) }
]);

export const bytesToBase64 = (bytes) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};
