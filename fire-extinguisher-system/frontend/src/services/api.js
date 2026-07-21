import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  profile:  ()     => api.get('/auth/profile'),
  updateProfile:   (data) => api.put('/auth/profile', data),
  changePassword:  (data) => api.put('/auth/change-password', data),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
};

// ─── Extinguishers ────────────────────────────────────────────────────────────
export const extAPI = {
  getAll:  (params) => api.get('/extinguishers', { params }),
  getById: (id)     => api.get(`/extinguishers/${id}`),
  create:  (data)   => api.post('/extinguishers', data),
  update:  (id, data) => api.put(`/extinguishers/${id}`, data),
  remove:  (id)     => api.delete(`/extinguishers/${id}`),
};

// ─── Inspections ──────────────────────────────────────────────────────────────
export const inspectionAPI = {
  getAll:    (params) => api.get('/inspections', { params }),
  getById:   (id)     => api.get(`/inspections/${id}`),
  create:    (data)   => api.post('/inspections', data),
  schedule:  (data)   => api.post('/inspections/schedule', data),
};

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const maintenanceAPI = {
  getAll:  (params) => api.get('/maintenance', { params }),
  getById: (id)     => api.get(`/maintenance/${id}`),
  create:  (data)   => api.post('/maintenance', data),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportAPI = {
  summary:  ()       => api.get('/reports/summary'),
  stock:    ()       => api.get('/reports/stock'),
  daily:    (params) => api.get('/reports/daily', { params }),
  monthly:  (params) => api.get('/reports/monthly', { params }),
  yearly:   (params) => api.get('/reports/yearly', { params }),
  exportCSV:()       => api.get('/reports/export', { responseType: 'blob' }),
};

// ─── Users (Admin) ───────────────────────────────────────────────────────────
export const userAPI = {
  getAll:      ()         => api.get('/users'),
  getById:     (id)       => api.get(`/users/${id}`),
  updateRole:  (id, role) => api.put(`/users/${id}/role`, { role }),
  remove:      (id)       => api.delete(`/users/${id}`),
};

export default api;
