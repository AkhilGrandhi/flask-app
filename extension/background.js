async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("[bg] active tab:", tab);
  return tab?.id;
}

async function sendToTab(tabId, message) {
  console.log("[bg] sendToTab", tabId, message);
  return chrome.tabs.sendMessage(tabId, message);
}

async function api(path, { method = "GET", body } = {}) {
  const { backendBase } = await chrome.storage.sync.get(["backendBase"]);
  console.log("[bg] api backendBase:", backendBase, "path:", path);
  if (!backendBase) throw new Error("Missing backendBase. Configure in Options.");
  const url = `${backendBase}${path}`;
  console.log("[bg] fetching:", url, "method:", method, "body:", body);
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log("[bg] response status:", res.status, "body:", text);
  const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[bg] onMessage:", msg, "from", sender);
  (async () => {
    try {
      if (msg?.type === "AUTOFILL") {
        const { candidate } = msg;
        const tabId = await getActiveTabId();
        if (!tabId) throw new Error("No active tab");

        const scanRes = await sendToTab(tabId, { type: "SCAN_FIELDS" });
        console.log("[bg] scanRes:", scanRes);
        const fields = scanRes?.fields || [];

        const mapped = await api("/api/ai/map-fields", {
          method: "POST",
          body: { candidate, fields }
        });
        console.log("[bg] mapped:", mapped);

        const fillRes = await sendToTab(tabId, { type: "FILL_FIELDS", mapping: mapped.mapping || {} });
        console.log("[bg] fillRes:", fillRes);

        sendResponse({ ok: true, filled: fillRes?.filled || 0 });
        return;
      }
    } catch (e) {
      console.error("[bg] error:", e);
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true;
});
