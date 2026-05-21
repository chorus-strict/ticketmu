import axios from 'axios';
import { safeStorage } from '../lib/safeStorage';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api',
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = safeStorage.getItem('auth_token');
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
      safeStorage.removeItem('auth_token');
      safeStorage.removeItem('auth_user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; // auto-redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
