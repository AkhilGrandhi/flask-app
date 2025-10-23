//For Local Development
// const API = "/api";

//For Production
const API = import.meta.env.VITE_API_URL || "/api";

function getCookie(name) {
  return document.cookie.split("; ").find(c => c.startsWith(name + "="))?.split("=")[1];
}

export async function api(path, { method="GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  // If you enable CSRF later: if (method !== "GET") { const csrf = getCookie("csrf_access_token"); if (csrf) headers["X-CSRF-TOKEN"] = csrf; }
  const res = await fetch(`${API}${path}`, {
    method, headers, credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

// Auth
export const loginAdmin = (email, password) => api("/auth/login-admin", { method:"POST", body:{email, password} });
export const loginUser  = (mobile, password) => api("/auth/login-user",  { method:"POST", body:{mobile, password} });
export const meApi      = () => api("/auth/me");
export const logoutApi  = () => api("/auth/logout", { method:"POST" });

// Admin users
export const listUsers = () => api("/admin/users");
export const createUser = (payload) => api("/admin/users", { method:"POST", body: payload });
export const updateUser = (id, payload) => api(`/admin/users/${id}`, { method:"PUT", body: payload });
export const deleteUser = (id) => api(`/admin/users/${id}`, { method:"DELETE" });

// Admin candidates
export const listAllCandidates = () => api("/admin/candidates");
export const adminUpdateCandidate = (id, payload) => api(`/admin/candidates/${id}`, { method:"PUT", body: payload });
export const adminDeleteCandidate = (id) => api(`/admin/candidates/${id}`, { method:"DELETE" });

// User candidates
export const listMyCandidates = () => api("/candidates");
export const createCandidate = (payload) => api("/candidates", { method:"POST", body: payload });
export const updateCandidate = (id, payload) => api(`/candidates/${id}`, { method:"PUT", body: payload });
export const deleteCandidate = (id) => api(`/candidates/${id}`, { method:"DELETE" });

// Candidate details + jobs
export const getCandidate     = (id)                => api(`/candidates/${id}`);
export const listCandidateJobs = (id)               => api(`/candidates/${id}/jobs`);
export const addCandidateJob   = (id, payload)      => api(`/candidates/${id}/jobs`, { method: "POST", body: payload });
export const updateCandidateJob = (id, jobRowId, payload) => api(`/candidates/${id}/jobs/${jobRowId}`, { method: "PUT", body: payload });
export const deleteCandidateJob = (id, jobRowId)    => api(`/candidates/${id}/jobs/${jobRowId}`, { method: "DELETE" });

// Resume generation
export const generateResume = async (job_desc, candidate_info, file_type = "word", candidate_id = null, job_row_id = null) => {
  const res = await fetch(`${API}/resume/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ job_desc, candidate_info, file_type, candidate_id, job_row_id })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || res.statusText);
  }
  return res.blob(); // Return blob for download
};

