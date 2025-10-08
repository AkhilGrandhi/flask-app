const $user   = document.getElementById("userSelect");
const $cand   = document.getElementById("candidateSelect");
const $btn    = document.getElementById("autofillBtn");
const $status = document.getElementById("status") || document.createElement("span");

function setStatus(msg) {
  if ($status) $status.textContent = msg;
  console.log("[popup] status:", msg);
}

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
    const ok = data && typeof data === "object" && "users" in data;
    console.log("[popup] checkBase:", base, "ok:", ok);
    return ok;
  } catch (e) {
    console.log("[popup] checkBase failed:", base, e.message);
    return false;
  }
}

async function getActiveTabOrigin() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    const u = new URL(tab.url);
    return u.origin; // e.g., http://localhost:5173
  } catch {
    return null;
  }
}

async function candidateBases() {
  const list = new Set();

  // Common dev bases
  list.add("http://localhost:5000");
  list.add("http://127.0.0.1:5000");
  list.add("http://0.0.0.0:5000");

  // Heuristic from active tab (e.g., Vite 5173 -> API 5000)
  const origin = await getActiveTabOrigin();
  if (origin) {
    try {
      const u = new URL(origin);
      // Same host, port 5000
      list.add(`${u.protocol}//${u.hostname}:5000`);
      // If running the API on the same origin (rare but try)
      list.add(`${u.protocol}//${u.host}`);
      // Common alt port
      list.add(`${u.protocol}//${u.hostname}:8000`);
    } catch { /* ignore */ }
  }

  return Array.from(list);
}

async function autoDetectBase() {
  setStatus("Detecting API…");
  const candidates = await candidateBases();
  console.log("[popup] candidateBases:", candidates);
  for (const base of candidates) {
    // permission guard: if host_permissions don’t allow this, fetch will fail here.
    const ok = await checkBase(base);
    if (ok) {
      await saveBase(base);
      return base;
    }
  }
  return "";
}

async function api(path) {
  let base = await getStoredBase();
  if (!base) base = await autoDetectBase();          // try detection
  if (!base) throw new Error("Could not detect API. Open Options to set backendBase.");
  const url = `${base.replace(/\/+$/, "")}${path}`;
  console.log("[popup] fetching:", url);
  const res = await fetch(url);
  const text = await res.text();
  console.log("[popup] response", res.status, text);
  const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

async function loadUsersAndCandidates() {
  setStatus("Loading users & candidates…");
  const usersRes = await api("/api/public/users");
  const candsRes = await api("/api/public/candidates");

  $user.innerHTML = "";
  (usersRes.users || []).forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name || u.email || ("User#" + u.id)} (#${u.id})`;
    $user.appendChild(opt);
  });

  const renderCandidates = () => {
    const uid = Number($user.value);
    $cand.innerHTML = "";
    const list = (candsRes.candidates || []).filter(c => {
      const cid = c.created_by?.id ?? c.created_by_user_id ?? null;
      return cid === uid;
    });
    if (!list.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No candidates for this user";
      $cand.appendChild(o);
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

$btn.addEventListener("click", () => {
  const uid = $user.value;
  const cid = $cand.value;
  console.log("[popup] Autofill clicked. user:", uid, "candidate:", cid);
  if (!cid) setStatus("Pick a candidate");
  else setStatus(`Selected candidate #${cid} (user #${uid})`);
});

(async function init() {
  try {
    setStatus("Initializing…");
    await loadUsersAndCandidates();
  } catch (e) {
    console.error("[popup] init error:", e);
    setStatus(e.message);
    // Offer a Configure button if detection failed
    const p = document.getElementById("msg") || document.body.appendChild(document.createElement("p"));
    const b = document.createElement("button");
    b.textContent = "Open Options";
    b.onclick = () => chrome.runtime.openOptionsPage();
    p.appendChild(b);
  }
})();

// const $user   = document.getElementById("userSelect");
// const $cand   = document.getElementById("candidateSelect");
// const $btn    = document.getElementById("autofillBtn");
// const $status = document.getElementById("status");

// async function getBase() {
//   const { backendBase } = await chrome.storage.sync.get(["backendBase"]);
//   return backendBase;
// }

// async function api(path) {
//   const base = await getBase();
//   console.log("[popup] backendBase:", base);
//   if (!base) throw new Error("Missing backendBase. Open Options and Save the API URL.");
//   const url = `${base}${path}`;
//   console.log("[popup] fetching:", url);
//   const res = await fetch(url);
//   const text = await res.text();
//   console.log("[popup] response", res.status, text);
//   const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
//   if (!res.ok) throw new Error(data.message || res.statusText);
//   return data;
// }

// function setStatus(msg) { $status.textContent = msg; }

// async function loadUsersAndCandidates() {
//   setStatus("Loading users & candidates…");
//   const usersRes = await api("/api/public/users");
//   const candsRes = await api("/api/public/candidates");

//   // Populate users
//   $user.innerHTML = "";
//   (usersRes.users || []).forEach(u => {
//     const opt = document.createElement("option");
//     opt.value = u.id;
//     opt.textContent = `${u.name || u.email || ("User#" + u.id)} (#${u.id})`;
//     $user.appendChild(opt);
//   });

//   // Render candidates for selected user
//   const renderCandidates = () => {
//     const uid = Number($user.value);
//     $cand.innerHTML = "";
//     const list = (candsRes.candidates || []).filter(c => {
//       // handle either created_by: {id: ...} or created_by_user_id
//       const cid = c.created_by?.id ?? c.created_by_user_id ?? null;
//       return cid === uid;
//     });
//     if (!list.length) {
//       const o = document.createElement("option");
//       o.value = "";
//       o.textContent = "No candidates for this user";
//       $cand.appendChild(o);
//     } else {
//       list.forEach(c => {
//         const o = document.createElement("option");
//         o.value = c.id;
//         o.textContent = `${c.first_name} ${c.last_name} (#${c.id})`;
//         $cand.appendChild(o);
//       });
//     }
//   };

//   $user.onchange = renderCandidates;
//   if ($user.value) renderCandidates();
//   setStatus("Ready");
// }

// // For now Autofill just logs the selected ids.
// // We'll wire actual autofill later.
// $btn.addEventListener("click", () => {
//   const uid = $user.value;
//   const cid = $cand.value;
//   console.log("[popup] Autofill clicked. user:", uid, "candidate:", cid);
//   if (!cid) {
//     setStatus("Pick a candidate");
//   } else {
//     setStatus(`Selected candidate #${cid} (user #${uid})`);
//   }
// });

// (async function init() {
//   try {
//     const base = await getBase();
//     if (!base) {
//       setStatus("Missing backendBase. Click to configure.");
//       // Add a quick configure button
//       const btn = document.createElement("button");
//       btn.textContent = "Configure";
//       btn.onclick = () => chrome.runtime.openOptionsPage();
//       document.getElementById("msg").appendChild(btn);
//       return;
//     }
//     await loadUsersAndCandidates();
//   } catch (e) {
//     console.error("[popup] init error:", e);
//     setStatus(e.message);
//   }
// })();
