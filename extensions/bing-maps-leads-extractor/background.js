import { bytesToBase64, createCsv, createXlsx } from "./exporter.js";

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url?.startsWith("https://www.bing.com/maps")) return;
  chrome.tabs.sendMessage(tab.id, { type: "BML_TOGGLE_PANEL" }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "BML_EXPORT") return false;

  const leads = Array.isArray(message.leads) ? message.leads : [];
  const format = message.format === "xlsx" ? "xlsx" : "csv";
  const filename = `bing-maps-leads-${timestamp()}.${format}`;

  try {
    const url = format === "xlsx"
      ? `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${bytesToBase64(createXlsx(leads))}`
      : `data:text/csv;charset=utf-8,${encodeURIComponent(createCsv(leads))}`;

    chrome.downloads.download({ url, filename, saveAs: true }, (downloadId) => {
      const error = chrome.runtime.lastError;
      if (error) {
        sendResponse({ ok: false, error: error.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    });
  } catch (error) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
  return true;
});
