import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizmanager-token');

  // Ensure the token exists AND is not a literal string error
  if (token && token !== 'undefined' && token !== 'null' && token !== '[object Object]') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if we're on login/register endpoints
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('bizmanager-token');
        localStorage.removeItem('bizmanager-user');
        window.location.hash = '#/login';
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;