const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const TOKEN_KEY = "legalai_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
};

const request = async (path, { method = "GET", body, auth = true } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A blocked or expired admin token should drop straight back to the login screen.
    if (res.status === 401 || res.status === 403) clearToken();
    throw new Error(json.message || `Request failed (${res.status})`);
  }

  return json;
};

export const api = {
  sendOtp: (mobile) => request("/auth/send-otp", { method: "POST", body: { mobile }, auth: false }),
  verifyOtp: (mobile, otp) =>
    request("/auth/verify-otp", { method: "POST", body: { mobile, otp }, auth: false }),
  me: () => request("/auth/me"),
  dashboardStats: () => request("/admin/dashboard/stats"),
  userGrowth: (days = 7) => request(`/admin/dashboard/user-growth?days=${days}`),
  recentActivity: () => request("/admin/dashboard/recent"),

  listUsers: (params) => request(`/admin/users${qs(params)}`),
  blockUser: (id, reason) => request(`/admin/users/${id}/block`, { method: "PATCH", body: { reason } }),
  unblockUser: (id) => request(`/admin/users/${id}/unblock`, { method: "PATCH" }),

  listLawyers: (params) => request(`/admin/lawyers${qs(params)}`),
  approveLawyer: (id) => request(`/admin/lawyers/${id}/approve`, { method: "PATCH" }),
  rejectLawyer: (id, rejectionReason) =>
    request(`/admin/lawyers/${id}/reject`, { method: "PATCH", body: { rejectionReason } }),

  listConsultations: (params) => request(`/admin/consultations${qs(params)}`),
};
