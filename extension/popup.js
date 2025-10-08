const $user   = document.getElementById("userSelect");
const $cand   = document.getElementById("candidateSelect");
const $btn    = document.getElementById("autofillBtn");
const $status = document.getElementById("status");

const state = { users: [], candidates: [] };

function setStatus(msg) { if ($status) $status.textContent = msg; console.log("[popup] status:", msg); }

async function getStoredBase() {
  const { backendBase } = await chrome.storage.sync.get(["backendBase"]);
  return backendBase || "";
}
async function saveBase(base) {
  await chrome.storage.sync.set({ backendBase: base.replace(/\/+$/, "") });
  console.log("[popup] saved backendBase:", base);
}
function withTimeout(promise, ms = 2500) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return promise.finally(() => clearTimeout(t));
}
async function checkBase(base) {
  const url = `${base.replace(/\/+$/, "")}/api/public/users`;
  try {
    const res = await withTimeout(fetch(url, { signal: new AbortController().signal }), 2500);
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data && typeof data === "object" && "users" in data;
  } catch {
    return false;
  }
}
async function getActiveTabOrigin() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    return new URL(tab.url).origin;
  } catch {
    return null;
  }
}
async function candidateBases() {
  const s = new Set(["http://localhost:5000","http://127.0.0.1:5000","http://0.0.0.0:5000"]);
  const origin = await getActiveTabOrigin();
  if (origin) {
    const u = new URL(origin);
    s.add(`${u.protocol}//${u.hostname}:5000`);
    s.add(`${u.protocol}//${u.host}`);
    s.add(`${u.protocol}//${u.hostname}:8000`);
  }
  return Array.from(s);
}
async function autoDetectBase() {
  setStatus("Detecting API…");
  for (const base of await candidateBases()) {
    if (await checkBase(base)) { await saveBase(base); return base; }
  }
  return "";
}
// --- add POST support in api() ---
async function api(path, opts = {}) {
  let base = await getStoredBase();
  if (!base) base = await autoDetectBase();
  if (!base) throw new Error("Could not detect API. Set backendBase or run Flask on :5000.");
  const url = `${base.replace(/\/+$/, "")}${path}`;
  const { method = "GET", body } = opts;
  console.log("[popup] fetch", method, url, body || "");
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}
// async function api(path) {
//   let base = await getStoredBase();
//   if (!base) base = await autoDetectBase();
//   if (!base) throw new Error("Could not detect API. Set backendBase or run Flask on :5000.");
//   const url = `${base.replace(/\/+$/, "")}${path}`;
//   console.log("[popup] GET", url);
//   const res = await fetch(url);
//   const text = await res.text();
//   console.log("[popup] →", res.status, text);
//   const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
//   if (!res.ok) throw new Error(data.message || res.statusText);
//   return data;
// }

async function loadUsersAndCandidates() {
  setStatus("Loading users & candidates…");
  const usersRes = await api("/api/public/users");
  const candsRes = await api("/api/public/candidates");
  state.users = usersRes.users || [];
  state.candidates = candsRes.candidates || [];

  // Users
  $user.innerHTML = "";
  state.users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name || u.email || ("User#" + u.id)} (#${u.id})`;
    $user.appendChild(opt);
  });

  // Candidates filtered by user
  const renderCandidates = () => {
    const uid = Number($user.value);
    $cand.innerHTML = "";
    const list = (state.candidates || []).filter(c => (c.created_by?.id ?? c.created_by_user_id ?? null) === uid);
    if (!list.length) {
      const o = document.createElement("option"); o.value = ""; o.textContent = "No candidates for this user"; $cand.appendChild(o);
    } else {
      list.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = `${c.first_name} ${c.last_name} (#${c.id})`;
        $cand.appendChild(o);
      });
    }
  };

  $user.onchange = renderCandidates;
  if ($user.value) renderCandidates();
  setStatus("Ready");
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

// Prefer your richer content.js collector; fallback to SCAN_FIELDS
async function collectFormFromPage(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { action: "collectFormData" });
  } catch (e1) {
    console.log("[popup] collectFormData failed, try SCAN_FIELDS:", e1.message);
    try {
      return await chrome.tabs.sendMessage(tabId, { type: "SCAN_FIELDS" });
    } catch (e2) {
      console.log("[popup] SCAN_FIELDS failed; injecting content.js then retrying…", e2.message);
      await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
      try { return await chrome.tabs.sendMessage(tabId, { action: "collectFormData" }); }
      catch { return await chrome.tabs.sendMessage(tabId, { type: "SCAN_FIELDS" }); }
    }
  }
}

// $btn.addEventListener("click", async () => {
//   try {
//     setStatus("Collecting candidate & form…");
//     const cid = Number($cand.value);
//     if (!cid) { setStatus("Pick a candidate"); return; }

//     // 1) full candidate by id
//     const { candidate } = await api(`/api/public/candidates/${cid}`);

//     // 2) current page form schema
//     const tabId = await getActiveTabId();
//     if (!tabId) { setStatus("No active tab"); return; }
//     const formSchema = await collectFormFromPage(tabId);

//     // 3) log both
//     console.log("=== SELECTED CANDIDATE ===");
//     console.log(candidate);
//     console.log("=== FORM SCHEMA (from page) ===");
//     console.log(formSchema);

//     const count = Array.isArray(formSchema?.fields) ? formSchema.fields.length : Object.keys(formSchema || {}).length;
//     setStatus(`Got candidate + ${count} field(s). Check console.`);
//   } catch (e) {
//     console.error("[popup] error:", e);
//     setStatus(e.message);
//   }
// });

// --- replace the Autofill click handler with this version ---
$btn.addEventListener("click", async () => {
  try {
    setStatus("Collecting candidate & form…");
    const cid = Number($cand.value);
    if (!cid) { setStatus("Pick a candidate"); return; }

    // 1) full candidate (optional for debugging; server also accepts candidate_id)
    const { candidate } = await api(`/api/public/candidates/${cid}`);

    // 2) current page form schema (OBJECT with keys = field names/ids)
    const tabId = await getActiveTabId();
    if (!tabId) { setStatus("No active tab"); return; }
    const formSchema = await collectFormFromPage(tabId); // your content.js returns an object

    // Normalize: your collector returns the object directly; if it returns {fields: [...]}, keep that too
    const formObj = Array.isArray(formSchema?.fields) ? formSchema.fields : formSchema;

    // 3) Ask backend → GPT to map
    setStatus("Mapping with GPT…");
    const mapped = await api("/api/ai/map-fields", {
      method: "POST",
      body: { candidate_id: cid, form: formObj }
      // (or body: { candidate, form: formObj } to send full candidate)
    });

    // 4) Print mapping JSON in popup
    const $mapJson = document.getElementById("mapJson");
    if ($mapJson) $mapJson.textContent = JSON.stringify(mapped.mapping || {}, null, 2);

    // 5) Ask the content script to fill the page
    const fillRes = await chrome.tabs.sendMessage(tabId, {
      action: "autofillForm",
      data: mapped.mapping || {}
    });

    setStatus(`Mapped ${Object.keys(mapped.mapping || {}).length} field(s); filled ${fillRes?.filled ?? 0}.`);

    const count = Object.keys(mapped.mapping || {}).length;
    setStatus(`Mapped ${count} field(s).`);
  } catch (e) {
    console.error("[popup] error:", e);
    setStatus(e.message);
  }
});

(async function init() {
  try { await loadUsersAndCandidates(); }
  catch (e) { console.error("[popup] init error:", e); setStatus(e.message); }
})();
