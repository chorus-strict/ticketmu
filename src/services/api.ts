import axios from 'axios';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api',
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors globally if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // window.location.href = '/login'; // Optional: auto-redirect
    }
    return Promise.reject(error);
  }
);

export default api;
