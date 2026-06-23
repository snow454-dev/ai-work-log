(function initContent() {
  "use strict";

  if (window.top !== window || document.getElementById("bml-extension-root")) return;

  const Core = globalThis.BingLeadsCore;
  const STORAGE_KEY = "bingMapsLeadsExtractorStateV1";
  const MAX_LIMIT = 500;
  const WAIT_BETWEEN_ITEMS = 1200;
  const DETAIL_TIMEOUT = 9000;
  const MAX_STALE_SCROLLS = 5;

  const defaultState = () => ({
    status: "idle",
    limit: 500,
    searchCategory: "",
    leads: [],
    processedKeys: [],
    duplicateCount: 0,
    errorCount: 0,
    currentName: "",
    message: "Bing Mapsで検索してから開始してください。",
    updatedAt: Date.now()
  });

  let state = defaultState();
  let stopRequested = false;
  let pauseRequested = false;
  let runningPromise = null;

  const host = document.createElement("div");
  host.id = "bml-extension-root";
  host.style.cssText = "position:fixed;right:20px;top:20px;z-index:2147483000;";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .panel {
        --ink:#17212b; --muted:#66717d; --line:#d9dee3; --paper:#f7f4ee;
        --surface:#ffffff; --accent:#d76032; --accent-dark:#aa3f18; --success:#25704a;
        width: 390px; max-height: calc(100dvh - 40px); overflow: hidden;
        color: var(--ink); background: var(--paper); border: 1px solid #c9c1b5;
        border-radius: 14px; box-shadow: 0 18px 45px rgba(34,29,23,.22);
        font-family: "Avenir Next", "Yu Gothic UI", "Hiragino Sans", sans-serif;
      }
      .panel.minimized .body { display:none; }
      .header {
        display:flex; align-items:center; gap:10px; padding:14px 14px 13px;
        background:#202a32; color:white; border-bottom:1px solid #11191f;
      }
      .mark {
        display:grid; place-items:center; width:34px; height:34px; border-radius:9px;
        background:var(--accent); color:white; font-family:Georgia,serif; font-weight:700;
      }
      .title { flex:1; min-width:0; }
      .title strong { display:block; font-family:Georgia,"Yu Mincho",serif; font-size:15px; }
      .title span { display:block; margin-top:2px; color:#aeb8c0; font-size:10px; }
      button, input { font:inherit; }
      button { cursor:pointer; }
      .icon-button {
        display:grid; place-items:center; width:30px; height:30px; padding:0;
        color:#dce2e6; background:transparent; border:1px solid #53606a; border-radius:8px;
      }
      .icon-button:hover { background:#34414a; }
      .body { max-height:calc(100dvh - 104px); overflow:auto; padding:14px; }
      .status-card {
        padding:13px; background:var(--surface); border:1px solid var(--line); border-radius:11px;
      }
      .eyebrow { color:var(--accent-dark); font-size:10px; font-weight:700; text-transform:uppercase; }
      .status-line { display:flex; justify-content:space-between; gap:12px; margin-top:7px; }
      .status-line strong { font-size:15px; }
      .count { color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }
      .progress { height:7px; margin-top:11px; overflow:hidden; background:#e5e0d8; border-radius:999px; }
      .progress > span { display:block; height:100%; background:var(--accent); transform-origin:left; }
      .message { min-height:32px; margin:9px 0 0; color:var(--muted); font-size:11px; line-height:1.45; }
      .metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin-top:10px; }
      .metric { padding:8px; background:#f2efe9; border-radius:8px; }
      .metric span { display:block; color:var(--muted); font-size:9px; }
      .metric strong { display:block; margin-top:2px; font-size:15px; font-variant-numeric:tabular-nums; }
      .controls { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .field { display:flex; flex-direction:column; gap:5px; }
      .field label { color:var(--muted); font-size:10px; font-weight:700; }
      .field input {
        width:100%; height:38px; padding:0 10px; color:var(--ink); background:white;
        border:1px solid var(--line); border-radius:8px; outline:none;
      }
      .field input:focus { border-color:var(--accent); box-shadow:0 0 0 2px rgba(215,96,50,.2); }
      .button {
        min-height:38px; padding:0 12px; border:1px solid transparent; border-radius:8px;
        font-weight:700; transition:transform 120ms ease-out, opacity 120ms ease-out;
      }
      .button:active { transform:translateY(1px); }
      .button:disabled { cursor:not-allowed; opacity:.45; }
      .primary { color:white; background:var(--accent); border-color:var(--accent-dark); }
      .secondary { color:var(--ink); background:white; border-color:var(--line); }
      .danger { color:#8b2f23; background:#fff7f5; border-color:#e7b7af; }
      .actions { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin-top:8px; }
      .section-title {
        display:flex; align-items:center; justify-content:space-between; margin:16px 1px 7px;
      }
      .section-title strong { font-family:Georgia,"Yu Mincho",serif; font-size:13px; }
      .section-title span { color:var(--muted); font-size:10px; font-variant-numeric:tabular-nums; }
      .table-wrap {
        max-height:220px; overflow:auto; background:white; border:1px solid var(--line); border-radius:10px;
      }
      table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:10px; }
      th { position:sticky; top:0; padding:8px; color:#56616b; background:#ebe7df; text-align:left; }
      td { padding:8px; overflow:hidden; border-top:1px solid #eee9e2; text-overflow:ellipsis; white-space:nowrap; }
      th:first-child,td:first-child { width:46%; }
      .empty { padding:26px 14px; color:var(--muted); text-align:center; line-height:1.6; }
      .error { margin-top:8px; color:#9b2e23; font-size:11px; }
      dialog {
        width:min(320px,calc(100% - 28px)); padding:0; color:var(--ink); background:white;
        border:1px solid var(--line); border-radius:12px; box-shadow:0 18px 45px rgba(34,29,23,.28);
      }
      dialog::backdrop { background:rgba(23,33,43,.48); }
      .dialog-body { padding:16px; }
      .dialog-body strong { display:block; font-family:Georgia,"Yu Mincho",serif; font-size:15px; }
      .dialog-body p { margin:8px 0 0; color:var(--muted); font-size:11px; line-height:1.6; }
      .dialog-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px; }
      @media (max-width:600px) {
        .panel { width:calc(100vw - 24px); max-height:calc(100dvh - 24px); }
        :host { right:12px; top:12px; }
      }
      @media (prefers-reduced-motion:reduce) {
        *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; }
      }
    </style>
    <aside class="panel" aria-label="Bing Maps Leads Extractor">
      <header class="header">
        <div class="mark" aria-hidden="true">B</div>
        <div class="title"><strong>Leads Extractor</strong><span>LOCAL BING MAPS WORKBENCH</span></div>
        <button class="icon-button" data-action="minimize" aria-label="パネルを最小化">−</button>
        <button class="icon-button" data-action="close" aria-label="パネルを閉じる">×</button>
      </header>
      <div class="body">
        <section class="status-card" aria-live="polite">
          <div class="eyebrow">Collector status</div>
          <div class="status-line"><strong data-view="status">待機中</strong><span class="count" data-view="count">0 / 500</span></div>
          <div class="progress" aria-hidden="true"><span data-view="progress" style="transform:scaleX(0)"></span></div>
          <p class="message" data-view="message"></p>
          <div class="metrics">
            <div class="metric"><span>取得済み</span><strong data-view="saved">0</strong></div>
            <div class="metric"><span>重複</span><strong data-view="duplicates">0</strong></div>
            <div class="metric"><span>エラー</span><strong data-view="errors">0</strong></div>
          </div>
        </section>

        <div class="controls">
          <div class="field">
            <label for="bml-limit">最大取得件数（上限500）</label>
            <input id="bml-limit" data-input="limit" type="number" min="1" max="500" value="500">
          </div>
          <button class="button primary" data-action="start">取得開始</button>
        </div>
        <div class="actions">
          <button class="button secondary" data-action="pause">一時停止</button>
          <button class="button secondary" data-action="resume">再開</button>
          <button class="button danger" data-action="stop">停止</button>
        </div>

        <div class="section-title"><strong>取得結果</strong><span data-view="updated"></span></div>
        <div class="table-wrap">
          <div class="empty" data-view="empty">検索結果を取得すると、ここに事業者が表示されます。</div>
          <table data-view="table" hidden>
            <thead><tr><th>店名</th><th>電話番号</th><th>評価</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="actions">
          <button class="button secondary" data-action="csv">CSV</button>
          <button class="button secondary" data-action="xlsx">Excel</button>
          <button class="button danger" data-action="clear">消去</button>
        </div>
        <div class="error" data-view="error" role="alert"></div>
      </div>
      <dialog data-view="clear-dialog" aria-labelledby="bml-clear-title">
        <div class="dialog-body">
          <strong id="bml-clear-title">取得結果を消去しますか？</strong>
          <p>保存済みの事業者データと進捗が、このブラウザから削除されます。</p>
          <div class="dialog-actions">
            <button class="button secondary" data-action="cancel-clear">キャンセル</button>
            <button class="button danger" data-action="confirm-clear">すべて消去</button>
          </div>
        </div>
      </dialog>
    </aside>
  `;

  const $ = (selector) => shadow.querySelector(selector);
  const views = {
    panel: $(".panel"),
    status: $('[data-view="status"]'),
    count: $('[data-view="count"]'),
    progress: $('[data-view="progress"]'),
    message: $('[data-view="message"]'),
    saved: $('[data-view="saved"]'),
    duplicates: $('[data-view="duplicates"]'),
    errors: $('[data-view="errors"]'),
    updated: $('[data-view="updated"]'),
    table: $('[data-view="table"]'),
    tbody: $("tbody"),
    empty: $('[data-view="empty"]'),
    error: $('[data-view="error"]'),
    limit: $('[data-input="limit"]'),
    clearDialog: $('[data-view="clear-dialog"]')
  };

  const statusLabels = {
    idle: "待機中",
    running: "取得中",
    paused: "一時停止",
    stopped: "停止",
    completed: "完了",
    error: "要確認"
  };

  const updateUi = () => {
    const count = state.leads.length;
    const limit = Math.max(1, Math.min(MAX_LIMIT, Number(state.limit) || MAX_LIMIT));
    views.status.textContent = statusLabels[state.status] || state.status;
    views.count.textContent = `${count} / ${limit}`;
    views.progress.style.transform = `scaleX(${Math.min(1, count / limit)})`;
    views.message.textContent = state.currentName
      ? `${state.message} — ${state.currentName}`
      : state.message;
    views.saved.textContent = String(count);
    views.duplicates.textContent = String(state.duplicateCount);
    views.errors.textContent = String(state.errorCount);
    views.updated.textContent = state.updatedAt
      ? new Date(state.updatedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      : "";
    views.limit.value = String(limit);

    const visibleLeads = state.leads.slice(-100).reverse();
    views.tbody.replaceChildren(...visibleLeads.map((lead) => {
      const row = document.createElement("tr");
      for (const value of [lead.name, lead.phone, lead.rating]) {
        const cell = document.createElement("td");
        cell.textContent = value || "—";
        cell.title = value || "";
        row.appendChild(cell);
      }
      return row;
    }));
    views.table.hidden = count === 0;
    views.empty.hidden = count !== 0;

    const running = state.status === "running";
    $('[data-action="start"]').disabled = running;
    $('[data-action="pause"]').disabled = !running;
    $('[data-action="resume"]').disabled = state.status !== "paused";
    $('[data-action="stop"]').disabled = !["running", "paused"].includes(state.status);
    $('[data-action="csv"]').disabled = count === 0;
    $('[data-action="xlsx"]').disabled = count === 0;
  };

  const saveState = async () => {
    state.updatedAt = Date.now();
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    updateUi();
  };

  const restoreState = async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    state = { ...defaultState(), ...(stored[STORAGE_KEY] || {}) };
    if (state.status === "running") {
      state.status = "paused";
      state.message = "ページが再読み込みされたため一時停止しました。再開できます。";
    }
    updateUi();
  };

  const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  const detectSearchCategory = () => {
    const heading = document.querySelector(
      ".locMagListTitle h2.b_entityTitle, h2.b_entityTitle:not(.eh_title)"
    )?.textContent;
    const query = document.querySelector(
      'input[aria-label*="Bing 地図を検索"], input[aria-label*="Search Bing Maps" i], input[type="search"]'
    )?.value;
    return Core.inferSearchCategory(heading, query);
  };

  const waitUntilRunnable = async () => {
    while (pauseRequested && !stopRequested) await sleep(250);
    if (stopRequested) throw new DOMException("Stopped", "AbortError");
  };

  const searchResultContainers = () => {
    const selectors = [
      ".b_split_cards_cont",
      ".b_lstcards",
      '[role="feed"]',
      '[role="list"]',
      ".listings",
      ".searchResults",
      '[aria-label*="results" i]',
      '[aria-label*="検索結果"]'
    ];
    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((element, index, all) => all.indexOf(element) === index)
      .sort((a, b) => b.scrollHeight - a.scrollHeight);
  };

  const candidateElements = () => {
    const containers = searchResultContainers();
    const root = containers[0] || document;
    const keyedCards = Array.from(root.querySelectorAll("li[data-key]"))
      .filter((element) => /^YN[A-Z0-9]+$/i.test(element.getAttribute("data-key") || ""));
    if (keyedCards.length > 0) return keyedCards;

    // Bingの旧レイアウト用フォールバック。リンク単体は広告やWebサイトを
    // 誤クリックするため、店舗見出しとボタンを持つカードだけに限定する。
    const candidates = Array.from(root.querySelectorAll("[data-entityid], [role='listitem']"));
    return candidates.filter((element) => {
      const text = Core.cleanText(element.textContent || element.getAttribute("aria-label"));
      const heading = element.querySelector("h2, h3, [role='heading']");
      const button = element.querySelector("button");
      return text.length >= 2 && text.length <= 800 &&
        Boolean(heading && button && element.getAttribute("data-entityid"));
    });
  };

  const candidateInfo = (element) => {
    const button = element.querySelector("button");
    const name =
      Core.cleanText(element.querySelector('[role="heading"], h2, h3, .title')?.textContent) ||
      Core.cleanText(element.getAttribute("aria-label")) ||
      Core.cleanText(element.textContent).slice(0, 140);
    const entityId = element.getAttribute("data-entityid") ||
      element.closest("[data-entityid]")?.getAttribute("data-entityid") || "";
    const dataKey = element.getAttribute("data-key") ||
      element.closest("[data-key]")?.getAttribute("data-key") || "";
    return {
      key: entityId
        ? `entity:${entityId}`
        : dataKey
          ? `entity:${dataKey}`
          : `candidate:${name.toLowerCase()}`,
      name,
      clickTarget: button,
      card: element
    };
  };

  const getDetailRoot = () => {
    const selectors = [
      "#lcmaginfocard",
      '[role="main"]',
      '[aria-label*="details" i]',
      '[aria-label*="詳細"]',
      ".entityContainer",
      ".placeDetails"
    ];
    const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const selected = candidates
      .filter((element) => !host.contains(element))
      .sort((a, b) => b.textContent.length - a.textContent.length)[0] || document.body;
    return selected.id === "lcmaginfocard"
      ? selected.closest(".b_lcmgzsubcrd") || selected
      : selected;
  };

  const waitForDetails = async (previousHeading) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < DETAIL_TIMEOUT) {
      await waitUntilRunnable();
      const root = getDetailRoot();
      const heading = Core.cleanText(
        root.querySelector('h2.eh_title,h1,[role="heading"][aria-level="1"]')?.textContent
      );
      if (heading && heading !== previousHeading) return root;
      await sleep(250);
    }
    throw new Error("店舗詳細の表示を確認できませんでした");
  };

  const clickCandidate = async (candidate) => {
    if (
      !candidate.clickTarget ||
      !candidate.clickTarget.isConnected ||
      !candidate.card?.isConnected ||
      !candidate.card.matches("li[data-key], [data-entityid], [role='listitem']") ||
      (
        candidate.card.hasAttribute("data-key") &&
        !/^YN[A-Z0-9]+$/i.test(candidate.card.getAttribute("data-key") || "")
      )
    ) {
      throw new Error("安全に操作できる店舗カードではありません");
    }
    const previousHeading = Core.cleanText(
      getDetailRoot().querySelector('h2.eh_title,h1,[role="heading"][aria-level="1"]')?.textContent
    );
    candidate.clickTarget.scrollIntoView({ block: "center", behavior: "auto" });
    candidate.clickTarget.click();
    return waitForDetails(previousHeading);
  };

  const appendLead = async (lead) => {
    const existing = new Set(state.leads.map(Core.leadKey));
    const key = Core.leadKey(lead);
    if (existing.has(key)) {
      state.duplicateCount += 1;
      return false;
    }
    state.leads.push(lead);
    await saveState();
    return true;
  };

  const scrollForMore = async () => {
    const resultContainer = searchResultContainers()[0];
    const container = resultContainer?.matches(".b_lstcards")
      ? resultContainer
      : resultContainer?.closest(".b_lstcards") || resultContainer;
    if (!container) return false;
    const before = container.scrollHeight;
    container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    await sleep(1000);
    return container.scrollHeight > before;
  };

  const runCollector = async () => {
    if (runningPromise) return runningPromise;
    stopRequested = false;
    pauseRequested = false;
    state.status = "running";
    state.message = "検索結果を確認しています。";
    await saveState();

    runningPromise = (async () => {
      let staleScrolls = 0;
      try {
        while (state.leads.length < state.limit) {
          await waitUntilRunnable();
          const processed = new Set(state.processedKeys);
          const candidates = candidateElements().map(candidateInfo);
          const next = candidates.find((candidate) => !processed.has(candidate.key));

          if (!next) {
            state.message = "次の検索結果を読み込んでいます。";
            await saveState();
            const grew = await scrollForMore();
            staleScrolls = grew ? 0 : staleScrolls + 1;
            if (staleScrolls >= MAX_STALE_SCROLLS) {
              state.status = "completed";
              state.message = "検索結果の末尾まで取得しました。";
              break;
            }
            continue;
          }

          state.currentName = next.name;
          state.message = "店舗詳細を解析しています。";
          await saveState();
          state.processedKeys.push(next.key);

          let captured = false;
          for (let attempt = 1; attempt <= 3 && !captured; attempt += 1) {
            try {
              const root = await clickCandidate(next);
              const lead = Core.parseLead(root, location.href);
              lead.searchCategory = state.searchCategory || detectSearchCategory();
              if (!lead.name) lead.name = next.name;
              await appendLead(lead);
              captured = true;
            } catch (error) {
              if (error?.name === "AbortError") throw error;
              if (attempt === 3) {
                state.errorCount += 1;
                state.message = `取得できない結果をスキップしました: ${error.message}`;
                await saveState();
              } else {
                await sleep(700 * attempt);
              }
            }
          }
          await sleep(WAIT_BETWEEN_ITEMS);
        }

        if (state.leads.length >= state.limit) {
          state.status = "completed";
          state.message = `指定件数 ${state.limit} 件の取得が完了しました。`;
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          state.status = "stopped";
          state.message = "取得を停止しました。取得済みデータは出力できます。";
        } else {
          state.status = "error";
          state.errorCount += 1;
          state.message = `処理を停止しました: ${error.message}`;
        }
      } finally {
        state.currentName = "";
        runningPromise = null;
        await saveState();
      }
    })();
    return runningPromise;
  };

  const showError = (message = "") => {
    views.error.textContent = message;
  };

  const exportLeads = async (format) => {
    showError();
    const response = await chrome.runtime.sendMessage({
      type: "BML_EXPORT",
      format,
      leads: state.leads
    });
    if (!response?.ok) showError(`出力できませんでした: ${response?.error || "不明なエラー"}`);
  };

  shadow.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    showError();

    if (action === "minimize") {
      views.panel.classList.toggle("minimized");
      button.textContent = views.panel.classList.contains("minimized") ? "+" : "−";
      button.setAttribute("aria-label", views.panel.classList.contains("minimized")
        ? "パネルを展開"
        : "パネルを最小化");
    } else if (action === "close") {
      host.style.display = "none";
    } else if (action === "start") {
      state.limit = Math.max(1, Math.min(MAX_LIMIT, Number(views.limit.value) || MAX_LIMIT));
      state.searchCategory = detectSearchCategory();
      if (state.status === "completed" || state.status === "stopped") {
        state.processedKeys = [];
      }
      runCollector();
    } else if (action === "pause") {
      pauseRequested = true;
      state.status = "paused";
      state.message = "一時停止しています。";
      await saveState();
    } else if (action === "resume") {
      pauseRequested = false;
      state.status = "running";
      state.message = "取得を再開しました。";
      await saveState();
      if (!runningPromise) runCollector();
    } else if (action === "stop") {
      stopRequested = true;
      pauseRequested = false;
    } else if (action === "csv" || action === "xlsx") {
      await exportLeads(action);
    } else if (action === "clear") {
      views.clearDialog.showModal();
    } else if (action === "cancel-clear") {
      views.clearDialog.close();
    } else if (action === "confirm-clear") {
      stopRequested = true;
      pauseRequested = false;
      state = defaultState();
      await saveState();
      views.clearDialog.close();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "BML_TOGGLE_PANEL") return;
    host.style.display = host.style.display === "none" ? "" : "none";
  });

  restoreState().catch((error) => {
    showError(`保存データを読み込めませんでした: ${error.message}`);
    updateUi();
  });
})();
