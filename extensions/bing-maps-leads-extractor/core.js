(function initCore(globalScope) {
  "use strict";

  const emptyLead = () => ({
    searchCategory: "",
    name: "",
    category: "",
    address: "",
    phone: "",
    website: "",
    email: "",
    social: "",
    latitude: "",
    longitude: "",
    rating: "",
    reviewCount: "",
    imageUrl: "",
    bingMapsUrl: ""
  });

  const cleanText = (value) =>
    String(value || "")
      .normalize("NFKC")
      .replace(/\u200B/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizePhone = (value) => cleanText(value).replace(/[^\d+]/g, "");

  const inferSearchCategory = (resultHeading, searchQuery) => {
    const heading = cleanText(resultHeading);
    if (heading) return heading;
    const queryParts = cleanText(searchQuery).split(" ").filter(Boolean);
    return queryParts.at(-1) || "";
  };

  const firstText = (root, selectors) => {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const text = cleanText(element?.textContent || element?.getAttribute?.("aria-label"));
      if (text) return text;
    }
    return "";
  };

  const firstAttribute = (root, selectors, attribute) => {
    for (const selector of selectors) {
      const value = root.querySelector(selector)?.getAttribute(attribute);
      if (value) return value;
    }
    return "";
  };

  const coordinateFromUrl = (url) => {
    let decoded = "";
    try {
      decoded = decodeURIComponent(String(url || ""));
    } catch {
      decoded = String(url || "");
    }

    const patterns = [
      /[?&]cp=(-?\d+(?:\.\d+)?)~(-?\d+(?:\.\d+)?)/i,
      /[?&]sp=point\.(-?\d+(?:\.\d+)?)_(-?\d+(?:\.\d+)?)/i,
      /[?&](?:where1|osid)=[^&]*?(-?\d{1,2}\.\d+)[,~_](-?\d{1,3}\.\d+)/i
    ];

    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (match) return { latitude: match[1], longitude: match[2] };
    }
    return { latitude: "", longitude: "" };
  };

  const valueAfterLabel = (root, labels) => {
    const normalizedLabels = labels.map((label) => cleanText(label).toLowerCase());
    const nodes = Array.from(root.querySelectorAll("button, a, div, span, li"));
    for (const node of nodes) {
      const aria = cleanText(node.getAttribute?.("aria-label"));
      const title = cleanText(node.getAttribute?.("title"));
      const text = cleanText(node.textContent);
      for (const candidate of [aria, title, text]) {
        const lower = candidate.toLowerCase();
        const label = normalizedLabels.find((item) => lower.startsWith(item));
        if (!label) continue;
        const value = cleanText(candidate.slice(label.length).replace(/^[:：\s-]+/, ""));
        if (value && value.length < 300) return value;
      }
    }
    return "";
  };

  const textFromLabeledGroup = (root, labels) => {
    const normalizedLabels = labels.map((label) => cleanText(label).toLowerCase());
    const groups = Array.from(root.querySelectorAll('[role="group"][aria-label]'));
    const group = groups.find((element) => {
      const aria = cleanText(element.getAttribute("aria-label")).toLowerCase();
      return normalizedLabels.some((label) => aria === label || aria.startsWith(`${label}.`));
    });
    return cleanText(group?.textContent);
  };

  const unwrapBingRedirect = (href) => {
    try {
      const url = new URL(href);
      if (/bing\.com$/i.test(url.hostname) && url.pathname.includes("/alink/link")) {
        return url.searchParams.get("url") || href;
      }
    } catch {}
    return href;
  };

  const findExternalWebsite = (root) => {
    const links = Array.from(root.querySelectorAll("a[href]"));
    for (const item of links) {
      const href = unwrapBingRedirect(item.href || "");
      if (
        /^https?:/i.test(href) &&
        !/bing\.com|microsoft\.com|virtualearth\.net|bingplaces\.com/i.test(href) &&
        !/facebook\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com/i.test(href)
      ) return href;
    }
    return "";
  };

  const findSocialLinks = (root) =>
    Array.from(root.querySelectorAll("a[href]"))
      .map((item) => item.href)
      .filter((href) => /facebook\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com/i.test(href))
      .filter((href, index, all) => all.indexOf(href) === index)
      .join(" | ");

  const findEmail = (root) => {
    const mailto = root.querySelector('a[href^="mailto:"]')?.getAttribute("href");
    if (mailto) return cleanText(mailto.replace(/^mailto:/i, "").split("?")[0]);
    const match = cleanText(root.textContent).match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );
    return match?.[0] || "";
  };

  const parseRating = (root) => {
    const text = cleanText(root.textContent);
    const rating =
      text.match(/(?:rating|評価)\s*[:：]?\s*(\d(?:\.\d+)?)/i)?.[1] ||
      firstAttribute(root, ['[aria-label*="star" i]', '[aria-label*="評価"]'], "aria-label")
        .match(/\d(?:\.\d+)?/)?.[0] ||
      "";
    const reviewCount =
      text.match(/([\d,.]+)\s*(?:reviews?|件の口コミ|口コミ)/i)?.[1]?.replace(/,/g, "") ||
      "";
    return { rating, reviewCount };
  };

  const parseLead = (root, pageUrl) => {
    const lead = emptyLead();
    lead.name = firstText(root, [
      "h2.eh_title",
      "h1",
      '[role="heading"][aria-level="1"]',
      '[role="heading"][aria-level="2"].eh_title',
      '[data-tag="title"]',
      ".entityTitle"
    ]);
    lead.category = valueAfterLabel(root, ["Category", "カテゴリ"]) ||
      firstText(root, [".b_factrow", ".b_subModule .b_secondaryText", '[data-tag="category"]']);
    lead.address = textFromLabeledGroup(root, ["Address", "住所", "所在地"]) ||
      valueAfterLabel(root, ["Address", "住所", "所在地"]);
    lead.phone = valueAfterLabel(root, ["Phone", "電話", "電話番号"]) ||
      cleanText(root.querySelector('a[href^="tel:"]')?.getAttribute("href")?.replace(/^tel:/, ""));
    lead.website = findExternalWebsite(root);
    lead.email = findEmail(root);
    lead.social = findSocialLinks(root);
    lead.imageUrl = firstAttribute(root, [
      'img[src*="bing.com/th"]',
      'img[src*="virtualearth"]',
      ".entityImage img",
      '[role="main"] img'
    ], "src");
    if (!lead.imageUrl) {
      const imageLink = root.querySelector('a[href*="mediaurl="]')?.getAttribute("href");
      try {
        lead.imageUrl = new URL(imageLink, "https://www.bing.com").searchParams.get("mediaurl") || "";
      } catch {}
    }
    lead.bingMapsUrl = String(pageUrl || "");

    const coordinates = coordinateFromUrl(pageUrl);
    lead.latitude = coordinates.latitude;
    lead.longitude = coordinates.longitude;

    const rating = parseRating(root);
    lead.rating = rating.rating;
    lead.reviewCount = rating.reviewCount;
    return lead;
  };

  const leadKey = (lead) => {
    const mapUrl = String(lead.bingMapsUrl || "");
    const mapId =
      mapUrl.match(/[?&](?:osid|ss|id)=([^&]+)/i)?.[1] ||
      mapUrl.match(/[?&]sece=ypid(?:%3A|:)([^&]+)/i)?.[1];
    if (mapId) return `map:${mapId}`;
    const name = cleanText(lead.name).toLowerCase();
    const address = cleanText(lead.address).toLowerCase();
    if (name && address) return `address:${name}|${address}`;
    const phone = normalizePhone(lead.phone);
    if (name && phone) return `phone:${name}|${phone}`;
    return `fallback:${name}|${cleanText(lead.bingMapsUrl).toLowerCase()}`;
  };

  const dedupeLeads = (leads) => {
    const seen = new Set();
    return leads.filter((lead) => {
      const key = leadKey(lead);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const sanitizeSpreadsheetCell = (value) => {
    const text = String(value ?? "");
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  };

  const api = {
    emptyLead,
    cleanText,
    normalizePhone,
    inferSearchCategory,
    coordinateFromUrl,
    parseLead,
    leadKey,
    dedupeLeads,
    sanitizeSpreadsheetCell
  };

  globalScope.BingLeadsCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
