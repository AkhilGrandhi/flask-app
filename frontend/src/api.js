// Automatically detect the correct API URL based on environment
const getApiUrl = () => {
  // If explicitly set via environment variable, use it (highest priority)
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're on Render deployment
  const hostname = window.location.hostname;
  
  // DEV Environment
  if (hostname.includes('flask-app-frontend-dev.onrender.com')) {
    const backendUrl = 'https://flask-app-backend-dev.onrender.com/api';
    console.log('🔵 Detected DEV environment, using backend URL:', backendUrl);
    return backendUrl;
  }
  
  // PROD Environment - Actual production URLs
  if (hostname.includes('flask-app-frontend-ojud.onrender.com')) {
    const backendUrl = 'https://flask-app-r5xw.onrender.com/api';
    console.log('🟢 Detected PROD environment, using backend URL:', backendUrl);
    return backendUrl;
  }
  
  // Legacy PROD naming (if you rename services later)
  if (hostname.includes('flask-app-frontend-prod.onrender.com')) {
    const backendUrl = 'https://flask-app-backend-prod.onrender.com/api';
    console.log('🟢 Detected PROD environment (alt), using backend URL:', backendUrl);
    return backendUrl;
  }
  
  // Generic Render frontend detection (fallback for other naming patterns)
  if (hostname.includes('onrender.com') && hostname.includes('frontend')) {
    // Extract the backend URL by replacing 'frontend' with 'backend'
    const backendUrl = `https://${hostname.replace('frontend', 'backend')}/api`;
    console.log('⚪ Detected Render deployment, inferred backend URL:', backendUrl);
    return backendUrl;
  }
  
  // For local development or other deployments
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('Using local development proxy: /api');
    return '/api'; // Vite dev server will proxy this
  }
  
  // Default fallback
  console.log('Using default fallback: /api');
  return '/api';
};

const API = getApiUrl();
console.log('API Base URL configured as:', API);

function getCookie(name) {
  return document.cookie.split("; ").find(c => c.startsWith(name + "="))?.split("=")[1];
}

// ============================================================
// PRODUCTION-GRADE REQUEST QUEUE
// Handles up to 50 concurrent users efficiently
// ============================================================
class RequestQueue {
  constructor(maxConcurrent = 10, minDelay = 100) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = maxConcurrent; // Increased for production (10 concurrent requests)
    this.minDelay = minDelay; // Reduced to 100ms for better responsiveness
    this.lastRequestTime = 0;
  }

  async add(fn) {
    // Wait if we're at max concurrent requests
    while (this.active >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
    }

    this.active++;
    this.lastRequestTime = Date.now();

    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}

const requestQueue = new RequestQueue(10, 100); // Production-optimized settings

// ============================================================
// INTELLIGENT CACHING SYSTEM
// - Caches GET requests with configurable TTL
// - Supports cache tags for smart invalidation
// - Prevents duplicate concurrent requests (deduplication)
// ============================================================
class IntelligentCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map(); // For request deduplication
    this.cacheTags = new Map(); // Map paths to tags (e.g., 'users', 'candidates')
  }

  // Cache configuration per endpoint
  getCacheConfig(path) {
    // Admin data - cache for 30 seconds (changes less frequently)
    if (path.includes('/admin/users')) return { ttl: 30000, tag: 'users' };
    if (path.includes('/admin/candidates')) return { ttl: 30000, tag: 'candidates' };
    
    // User data - cache for 20 seconds
    if (path.includes('/candidates/me')) return { ttl: 20000, tag: 'candidate-profile' };
    if (path.startsWith('/candidates') && !path.includes('/jobs')) return { ttl: 20000, tag: 'candidates' };
    
    // Job applications - cache for 15 seconds
    if (path.includes('/jobs')) return { ttl: 15000, tag: 'jobs' };
    
    // Auth checks - cache for 60 seconds
    if (path === '/auth/me') return { ttl: 60000, tag: 'auth' };
    
    // Default: cache for 10 seconds
    return { ttl: 10000, tag: 'default' };
  }

  key(path, method) {
    return `${method}:${path}`;
  }

  get(path, method = 'GET') {
    const k = this.key(path, method);
    const cached = this.cache.get(k);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✅ Cache HIT: ${method} ${path}`);
      return cached.promise;
    }
    
    // Check if there's a pending request for the same endpoint (deduplication)
    const pending = this.pendingRequests.get(k);
    if (pending) {
      console.log(`🔄 Request DEDUPLICATED: ${method} ${path}`);
      return pending;
    }
    
    return null;
  }

  set(path, method, promise) {
    const k = this.key(path, method);
    const config = this.getCacheConfig(path);
    
    // Store in pending requests for deduplication
    this.pendingRequests.set(k, promise);
    
    // Once resolved, move to cache and remove from pending
    promise.then(() => {
      this.pendingRequests.delete(k);
      this.cache.set(k, { 
        promise, 
        timestamp: Date.now(), 
        ttl: config.ttl,
        tag: config.tag 
      });
      
      // Store tag mapping
      if (!this.cacheTags.has(config.tag)) {
        this.cacheTags.set(config.tag, new Set());
      }
      this.cacheTags.get(config.tag).add(k);
      
      // Auto cleanup after TTL
      setTimeout(() => this.cache.delete(k), config.ttl);
    }).catch(() => {
      // On error, remove from pending
      this.pendingRequests.delete(k);
    });
  }

  // Invalidate cache by tag (e.g., invalidate all 'users' cache when a user is created/updated/deleted)
  invalidateByTag(tag) {
    const keys = this.cacheTags.get(tag);
    if (keys) {
      console.log(`🗑️ Cache invalidated for tag: ${tag} (${keys.size} entries)`);
      keys.forEach(key => this.cache.delete(key));
      this.cacheTags.delete(tag);
    }
  }

  // Clear all cache
  clearAll() {
    console.log('🗑️ All cache cleared');
    this.cache.clear();
    this.pendingRequests.clear();
    this.cacheTags.clear();
  }
}

const intelligentCache = new IntelligentCache();

// ============================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// Handles 429 (rate limiting) and network errors gracefully
// ============================================================
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const res = await fetch(url, options);
    
    // If rate limited (429), retry with exponential backoff
    if (res.status === 429 && retries > 0) {
      console.warn(`⚠️ Rate limited (429). Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return res;
  } catch (error) {
    // Network error - retry if retries available
    if (retries > 0) {
      console.warn(`⚠️ Network error. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// ============================================================
// TOKEN MANAGEMENT (localStorage)
// ============================================================
const TOKEN_KEY = 'jwt_token';

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('🔐 Token stored in localStorage');
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  console.log('🔓 Token removed from localStorage');
}

// ============================================================
// MAIN API FUNCTION
// - Intelligent caching for GET requests
// - Request queue for rate limiting
// - Automatic retry with exponential backoff
// - Cache invalidation for mutations
// - Authorization header for iOS/Safari compatibility
// ============================================================
export async function api(path, { method="GET", body } = {}) {
  // Check cache for GET requests (only cache reads, not writes)
  if (method === "GET") {
    const cached = intelligentCache.get(path, method);
    if (cached) {
      return cached; // Return cached promise (or deduplicated request)
    }
  }
  
  // Use request queue to prevent overwhelming the server
  const requestPromise = requestQueue.add(async () => {
    const headers = { "Content-Type": "application/json" };
    
    // Add Authorization header with JWT token (works on iOS/Safari)
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    console.log(`🌐 API Call: ${method} ${API}${path}`);
    
    const res = await fetchWithRetry(`${API}${path}`, {
      method, 
      headers, 
      credentials: "include", // Still include for cookie fallback
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log(`📡 API Response: ${res.status} ${method} ${path}`);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // Clear token on 401 (unauthorized)
      if (res.status === 401) {
        clearToken();
      }
      
      // Provide user-friendly error messages
      let errorMessage = data.message || res.statusText;
      
      if (res.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (res.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (res.status === 404) {
        errorMessage = "Resource not found.";
      } else if (res.status === 403) {
        errorMessage = "Access denied.";
      } else if (res.status === 401) {
        errorMessage = "Unauthorized. Please login again.";
      }
      
      console.error(`❌ API Error:`, data);
      throw new Error(errorMessage);
    }
    
    console.log(`✅ API Data received:`, Object.keys(data).length, 'keys');
    return data;
  });
  
  // Cache GET requests
  if (method === "GET") {
    intelligentCache.set(path, method, requestPromise);
  }
  
  // Invalidate related cache on mutations (POST/PUT/DELETE)
  if (method !== "GET") {
    requestPromise.then(() => {
      // Invalidate cache based on the endpoint
      if (path.includes('/admin/users') || path.includes('/users')) {
        intelligentCache.invalidateByTag('users');
      }
      if (path.includes('/admin/candidates') || path.includes('/candidates')) {
        intelligentCache.invalidateByTag('candidates');
        intelligentCache.invalidateByTag('candidate-profile');
      }
      if (path.includes('/jobs')) {
        intelligentCache.invalidateByTag('jobs');
      }
      if (path.includes('/auth/logout')) {
        clearToken(); // Clear token from localStorage
        intelligentCache.clearAll(); // Clear all cache on logout
      }
    });
  }
  
  return requestPromise;
}

// ============================================================
// API ENDPOINTS
// ============================================================

// Auth
export const loginAdmin = async (email, password) => {
  const data = await api("/auth/login-admin", { method:"POST", body:{email, password} });
  if (data.access_token) setToken(data.access_token);
  return data;
};
export const loginUser = async (mobile, password) => {
  const data = await api("/auth/login-user", { method:"POST", body:{mobile, password} });
  if (data.access_token) setToken(data.access_token);
  return data;
};
export const loginCandidate = async (phone, password) => {
  const data = await api("/auth/login-candidate", { method:"POST", body:{phone, password} });
  if (data.access_token) setToken(data.access_token);
  return data;
};
export const meApi = () => api("/auth/me");
export const logoutApi = async () => {
  const data = await api("/auth/logout", { method:"POST" });
  clearToken(); // Ensure token is cleared on logout
  return data;
};

// Admin users
export const listUsers = () => api("/admin/users");
export const createUser = (payload) => api("/admin/users", { method:"POST", body: payload });
export const updateUser = (id, payload) => api(`/admin/users/${id}`, { method:"PUT", body: payload });
export const deleteUser = (id) => api(`/admin/users/${id}`, { method:"DELETE" });
export const getUserCandidates = (id) => api(`/admin/users/${id}/candidates`);

// Admin candidates
export const listAllCandidates = () => api("/admin/candidates");
export const adminUpdateCandidate = (id, payload) => api(`/admin/candidates/${id}`, { method:"PUT", body: payload });
export const adminDeleteCandidate = (id) => api(`/admin/candidates/${id}`, { method:"DELETE" });

// User candidates
export const listMyCandidates = () => api("/candidates");
export const createCandidate = (payload) => api("/candidates", { method:"POST", body: payload });
export const updateCandidate = (id, payload) => api(`/candidates/${id}`, { method:"PUT", body: payload });
export const deleteCandidate = (id) => api(`/candidates/${id}`, { method:"DELETE" });

// Candidate self-service
export const getMyCandidateProfile = () => api("/candidates/me");
export const updateMyCandidateProfile = (payload) => api("/candidates/me", { method: "PUT", body: payload });

// Candidate details + jobs
export const getCandidate     = (id)                => api(`/candidates/${id}`);
export const listCandidateJobs = (id)               => api(`/candidates/${id}/jobs`);
export const addCandidateJob   = (id, payload)      => api(`/candidates/${id}/jobs`, { method: "POST", body: payload });
export const updateCandidateJob = (id, jobRowId, payload) => api(`/candidates/${id}/jobs/${jobRowId}`, { method: "PUT", body: payload });
export const deleteCandidateJob = (id, jobRowId)    => api(`/candidates/${id}/jobs/${jobRowId}`, { method: "DELETE" });

// Resume generation (sync - legacy)
export const generateResume = async (job_desc, candidate_info, file_type = "word", candidate_id = null, job_row_id = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API}/resume/generate`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ job_desc, candidate_info, file_type, candidate_id, job_row_id })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || res.statusText);
  }
  return res.blob(); // Return blob for download
};

// Resume generation (async - NEW)
export const generateResumeAsync = (payload) => 
  api("/resume-async/generate-async", { method: "POST", body: payload });

export const getJobStatus = (jobId) => 
  api(`/resume-async/job-status/${jobId}`);

export const downloadResumeAsync = async (jobId) => {
  const headers = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API}/resume-async/download/${jobId}`, {
    method: "GET",
    headers,
    credentials: "include"
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || res.statusText);
  }
  return res.blob();
};

export const getMyJobs = () => 
  api("/resume-async/my-jobs");

export const cancelJob = (jobId) => 
  api(`/resume-async/job/${jobId}`, { method: "DELETE" });

// Export cache for manual control if needed (e.g., force refresh button)
export const apiCache = intelligentCache;
