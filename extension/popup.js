// DOM Elements
const $loginForm = document.getElementById("loginForm");
const $mainForm = document.getElementById("mainForm");
const $mobileInput = document.getElementById("mobileInput");
const $passwordInput = document.getElementById("passwordInput");
const $loginBtn = document.getElementById("loginBtn");
const $logoutBtn = document.getElementById("logoutBtn");
const $userName = document.getElementById("userName");
const $userMobile = document.getElementById("userMobile");
const $cand = document.getElementById("candidateSelect");
const $btn = document.getElementById("autofillBtn");
const $status = document.getElementById("status");

const state = { 
  user: null, 
  token: null, 
  candidates: [] 
};

// ========== Status & UI Helpers ==========
function setStatus(msg, type = "normal") { 
  if ($status) {
    $status.textContent = msg;
    $status.className = "status-text";
    if (type === "loading") {
      $status.className = "status-text loading";
      $status.innerHTML = '<span class="loading-spinner"></span>' + msg;
    } else if (type === "success") {
      $status.className = "status-text success";
    } else if (type === "error") {
      $status.className = "status-text error";
    }
  }
  console.log("[popup] status:", msg); 
}

function showLoginForm() {
  $loginForm.style.display = "block";
  $mainForm.style.display = "none";
}

function showMainForm() {
  $loginForm.style.display = "none";
  $mainForm.style.display = "block";
}

// ========== Storage ==========
async function getStoredAuth() {
  const data = await chrome.storage.sync.get(["authToken", "authUser"]);
  return {
    token: data.authToken || null,
    user: data.authUser || null
  };
}

async function saveAuth(token, user) {
  await chrome.storage.sync.set({ 
    authToken: token,
    authUser: user
  });
  console.log("[popup] saved auth for user:", user);
}

async function clearAuth() {
  await chrome.storage.sync.remove(["authToken", "authUser"]);
  console.log("[popup] cleared auth");
}

async function getStoredBase() {
  const { backendBase } = await chrome.storage.sync.get(["backendBase"]);
  return backendBase || "";
}

async function saveBase(base) {
  await chrome.storage.sync.set({ backendBase: base.replace(/\/+$/, "") });
  console.log("[popup] saved backendBase:", base);
}

// ========== Backend Detection ==========
async function checkBase(base) {
  const url = `${base.replace(/\/+$/, "")}/api/public/users`;
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 2500);
  
  try {
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data && typeof data === "object" && "users" in data;
  } catch {
    clearTimeout(timeout);
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
  const s = new Set([
    // Production URL
    "https://flask-app-r5xw.onrender.com"
    
    // Local development URLs (uncomment for local testing)
    // "http://localhost:5000",
    // "http://127.0.0.1:5000",
    // "http://0.0.0.0:5000"
  ]);
  
  // Uncomment below for dynamic origin detection (useful for development)
  // const origin = await getActiveTabOrigin();
  // if (origin) {
  //   const u = new URL(origin);
  //   s.add(`${u.protocol}//${u.hostname}:5000`);
  //   s.add(`${u.protocol}//${u.host}`);
  //   s.add(`${u.protocol}//${u.hostname}:8000`);
  // }
  
  return Array.from(s);
}

async function autoDetectBase() {
  setStatus("🔍 Detecting API...", "loading");
  for (const base of await candidateBases()) {
    if (await checkBase(base)) { 
      await saveBase(base); 
      return base; 
    }
  }
  return "";
}

// ========== API Calls ==========
async function api(path, opts = {}) {
  let base = await getStoredBase();
  if (!base) base = await autoDetectBase();
  if (!base) throw new Error("Could not detect API. Check connection to backend.");
  
  const url = `${base.replace(/\/+$/, "")}${path}`;
  const { method = "GET", body, useAuth = false } = opts;
  
  const headers = { "Content-Type": "application/json" };
  
  // Add JWT token if useAuth is true
  if (useAuth && state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  
  console.log("[popup] fetch", method, url, useAuth ? "(authenticated)" : "");
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

// ========== Authentication ==========
async function login(mobile, password) {
  setStatus("🔐 Logging in...", "loading");
  
  try {
    // Use token-user endpoint to get JWT
    const response = await api("/api/auth/token-user", {
      method: "POST",
      body: { mobile, password }
    });
    
    if (!response.access_token) {
      throw new Error("No token received");
    }
    
    state.token = response.access_token;
    
    // Now get full user info with ID using the token
    const meResponse = await api("/api/auth/me", {
      method: "GET",
      useAuth: true
    });
    
    // Extract user data (API returns {user: {...}})
    const userData = meResponse.user || meResponse;
    
    // Store user info including ID
    const user = {
      id: userData.id,
      mobile: userData.mobile || mobile,
      role: userData.role || response.role || "user",
      name: userData.name || mobile,
      email: userData.email || ""
    };
    
    state.user = user;
    await saveAuth(response.access_token, user);
    
    // Update UI
    $userName.textContent = user.name || "User";
    $userMobile.textContent = user.mobile;
    
    showMainForm();
    await loadCandidates();
    setStatus("✅ Logged in successfully!", "success");
    
  } catch (error) {
    console.error("[popup] login error:", error);
    setStatus(`❌ Login failed: ${error.message}`, "error");
    throw error;
  }
}

async function logout() {
  state.token = null;
  state.user = null;
  state.candidates = [];
  await clearAuth();
  
  $mobileInput.value = "";
  $passwordInput.value = "";
  $cand.innerHTML = '<option value="">Loading candidates...</option>';
  
  showLoginForm();
  setStatus("👋 Logged out", "normal");
}

// ========== Load Candidates (for logged-in user only) ==========
async function loadCandidates() {
  setStatus("📥 Loading your candidates...", "loading");
  
  try {
    // Fetch all candidates from public endpoint
    const candsRes = await api("/api/public/candidates");
    const allCandidates = candsRes.candidates || [];
    
    console.log("[popup] Total candidates:", allCandidates.length);
    console.log("[popup] Current user ID:", state.user.id);
    
    // Filter to show only current user's candidates by creator ID
    const userCandidates = allCandidates.filter(c => {
      const creatorId = c.created_by?.id || c.created_by_user_id || null;
      console.log(`[popup] Candidate ${c.id}: creator_id=${creatorId}, match=${creatorId === state.user.id}`);
      return creatorId === state.user.id;
    });
    
    state.candidates = userCandidates;
    
    console.log("[popup] Filtered candidates for user:", userCandidates.length);
    
    // Populate dropdown
    $cand.innerHTML = "";
    if (userCandidates.length === 0) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No candidates found for your account";
      $cand.appendChild(o);
    } else {
      userCandidates.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = `${c.first_name} ${c.last_name} (#${c.id})`;
        $cand.appendChild(o);
      });
    }
    
    setStatus(`✅ Loaded ${userCandidates.length} candidate(s)`, "success");
  } catch (error) {
    console.error("[popup] load candidates error:", error);
    setStatus(`❌ Failed to load candidates: ${error.message}`, "error");
  }
}

// ========== Form Collection & Autofill ==========
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

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
      try { 
        return await chrome.tabs.sendMessage(tabId, { action: "collectFormData" }); 
      } catch { 
        return await chrome.tabs.sendMessage(tabId, { type: "SCAN_FIELDS" }); 
      }
    }
  }
}

// ========== Event Listeners ==========
$loginBtn.addEventListener("click", async () => {
  const mobile = $mobileInput.value.trim();
  const password = $passwordInput.value;
  
  if (!mobile || !password) {
    setStatus("⚠️ Please enter mobile and password", "error");
    return;
  }
  
  try {
    await login(mobile, password);
  } catch (error) {
    // Error already handled in login()
  }
});

// Allow Enter key to submit login
$passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    $loginBtn.click();
  }
});

$mobileInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    $passwordInput.focus();
  }
});

$logoutBtn.addEventListener("click", logout);

$btn.addEventListener("click", async () => {
  try {
    setStatus("📋 Collecting candidate & form...", "loading");
    const cid = Number($cand.value);
    if (!cid) { 
      setStatus("⚠️ Please select a candidate", "error"); 
      return; 
    }

    // 1) Full candidate data
    const { candidate } = await api(`/api/public/candidates/${cid}`);

    // 2) Current page form schema
    const tabId = await getActiveTabId();
    if (!tabId) { 
      setStatus("⚠️ No active tab found", "error"); 
      return; 
    }
    const formSchema = await collectFormFromPage(tabId);
    const formObj = Array.isArray(formSchema?.fields) ? formSchema.fields : formSchema;

    // 3) AI mapping
    setStatus("🤖 Mapping with AI...", "loading");
    const mapped = await api("/api/ai/map-fields", {
      method: "POST",
      body: { candidate_id: cid, form: formObj }
    });

    // 4) Display mapping
    const $mapJson = document.getElementById("mapJson");
    if ($mapJson) $mapJson.textContent = JSON.stringify(mapped.mapping || {}, null, 2);

    // 5) Fill the form
    const fillRes = await chrome.tabs.sendMessage(tabId, {
      action: "autofillForm",
      data: mapped.mapping || {}
    });

    const count = Object.keys(mapped.mapping || {}).length;
    const filled = fillRes?.filled ?? 0;
    setStatus(`✅ Success! Mapped ${count} field(s), filled ${filled}.`, "success");
  } catch (e) {
    console.error("[popup] error:", e);
    setStatus(`❌ Error: ${e.message}`, "error");
  }
});

// ========== Initialization ==========
(async function init() {
  try {
    setStatus("🔄 Initializing...", "loading");
    
    // Check if user is already logged in
    const auth = await getStoredAuth();
    
    if (auth.token && auth.user && auth.user.id) {
      // User has saved credentials with ID
      state.token = auth.token;
      state.user = auth.user;
      
      console.log("[popup] Auto-login with user:", auth.user);
      
      $userName.textContent = auth.user.name || "User";
      $userMobile.textContent = auth.user.mobile || "";
      
      showMainForm();
      await loadCandidates();
    } else if (auth.token && !auth.user?.id) {
      // Old session without user ID, need to re-fetch user info
      console.log("[popup] Old session detected, fetching user info...");
      state.token = auth.token;
      
      try {
        const meResponse = await api("/api/auth/me", {
          method: "GET",
          useAuth: true
        });
        
        // Extract user data (API returns {user: {...}})
        const userData = meResponse.user || meResponse;
        
        const user = {
          id: userData.id,
          mobile: userData.mobile,
          role: userData.role,
          name: userData.name,
          email: userData.email || ""
        };
        
        state.user = user;
        await saveAuth(auth.token, user);
        
        $userName.textContent = user.name || "User";
        $userMobile.textContent = user.mobile;
        
        showMainForm();
        await loadCandidates();
      } catch (e) {
        console.error("[popup] Failed to fetch user info, clearing session:", e);
        await clearAuth();
        showLoginForm();
        setStatus("👋 Please login to continue", "normal");
      }
    } else {
      // No saved credentials, show login
      showLoginForm();
      setStatus("👋 Please login to continue", "normal");
    }
  } catch (e) { 
    console.error("[popup] init error:", e); 
    setStatus(`❌ ${e.message}`, "error");
    showLoginForm();
  }
})();
