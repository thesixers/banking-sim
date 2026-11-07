const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("nova_token") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("nova_token", token);
  } else {
    localStorage.removeItem("nova_token");
  }
}

async function fetchApi(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.message || json.error || `Request failed (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = json;
    throw error;
  }

  return json.data || json;
}

export const api = {
  auth: {
    login: (credentials) =>
      fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (details) =>
      fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(details),
      }),
    me: () => fetchApi("/auth/me"),
  },
  accounts: {
    get: () => fetchApi("/accounts"),
    transactions: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi(`/accounts/transactions${q ? `?${q}` : ""}`);
    },
    faucet: (data) =>
      fetchApi("/accounts/faucet", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleFreeze: () =>
      fetchApi("/accounts/card/toggle-freeze", {
        method: "POST",
      }),
  },
  transfers: {
    verifyRecipient: (identifier) =>
      fetchApi("/transfers/verify-recipient", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      }),
    internal: (data) =>
      fetchApi("/transfers/internal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    externalInitiate: (data) =>
      fetchApi("/transfers/external/initiate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    externalVerify: (data) =>
      fetchApi("/transfers/external/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    externalResend: (reference_id) =>
      fetchApi("/transfers/external/resend-otp", {
        method: "POST",
        body: JSON.stringify({ reference_id }),
      }),
  },
  otp: {
    feed: () => fetchApi("/otp/inbox"),
    markRead: (id) =>
      fetchApi("/otp/mark-read", {
        method: "POST",
        body: JSON.stringify({ id }),
      }),
  },
  admin: {
    stats: () => fetchApi("/admin/stats"),
    users: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi(`/admin/users${q ? `?${q}` : ""}`);
    },
    user: (id) => fetchApi(`/admin/users/${id}`),
    adjustBalance: (id, data) =>
      fetchApi(`/admin/users/${id}/adjust-balance`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleFreeze: (id, is_frozen) =>
      fetchApi(`/admin/users/${id}/toggle-freeze`, {
        method: "POST",
        body: JSON.stringify({ is_frozen }),
      }),
    resetPassword: (id, new_password) =>
      fetchApi(`/admin/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password }),
      }),
    deleteUser: (id) =>
      fetchApi(`/admin/users/${id}`, {
        method: "DELETE",
      }),
    transactions: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi(`/admin/transactions${q ? `?${q}` : ""}`);
    },
    transactionAction: (id, action) =>
      fetchApi(`/admin/transactions/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    otpTokens: () => fetchApi("/admin/otp-tokens"),
    forceVerifyOtp: (id) =>
      fetchApi(`/admin/otp-tokens/${id}/force-verify`, {
        method: "POST",
      }),
  },
};
