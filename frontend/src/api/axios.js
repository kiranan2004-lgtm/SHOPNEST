import axios from 'axios';

// Create central Axios instance with backend API baseURL
// Supports VITE_API_BASE_URL or VITE_API_URL in production (e.g. Netlify),
// falling back to local Django development server (http://localhost:8000/api)
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Normalize: ensure it ends with /api if user passes base domain without /api
const normalizedBaseUrl = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : rawBaseUrl.endsWith('/')
  ? `${rawBaseUrl}api`
  : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attaches DRF Token if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopnest_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration or unauthorized errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 Unauthorized and it's not a login attempt, clear token
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('shopnest_token');
        localStorage.removeItem('shopnest_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
