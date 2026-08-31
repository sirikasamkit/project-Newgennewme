const API_BASE = '/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (username, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    return handleResponse(res);
  },

  checkEmail: async (email) => {
    const res = await fetch(`${API_BASE}/auth/check-email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (email, new_password) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, new_password }),
    });
    return handleResponse(res);
  },

  // AI Services
  generatePlan: async (payload) => {
    const res = await fetch(`${API_BASE}/ai/generate-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  analyzeFood: async (formData) => {
    const res = await fetch(`${API_BASE}/ai/analyze-food`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  chat: async (message) => {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  // User Profile
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getProfileImage: async () => {
    const res = await fetch(`${API_BASE}/user/profile/image`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (payload) => {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // History
  getHistory: async (page = 1) => {
    const res = await fetch(`${API_BASE}/user/history?page=${page}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteBmiHistory: async (id) => {
    const res = await fetch(`${API_BASE}/user/history/bmi/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteFoodHistory: async (id) => {
    const res = await fetch(`${API_BASE}/user/history/food/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deletePlanHistory: async (id) => {
    const res = await fetch(`${API_BASE}/user/history/plan/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Daily Tracking
  getTracking: async () => {
    const res = await fetch(`${API_BASE}/user/tracking`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  saveTracking: async (trackingData) => {
    const res = await fetch(`${API_BASE}/user/tracking`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(trackingData),
    });
    return handleResponse(res);
  },

  // Reports
  submitBugReport: async (email, message) => {
    const res = await fetch(`${API_BASE}/user/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, message }),
    });
    return handleResponse(res);
  },

  // Admin
  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteAdminUser: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAdminBugReports: async () => {
    const res = await fetch(`${API_BASE}/admin/bug-reports`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteAdminBugReport: async (id) => {
    const res = await fetch(`${API_BASE}/admin/bug-reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
