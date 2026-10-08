import axios from 'axios';
import { API_URL } from './config';

const TOKEN_KEY = 'access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isLoggedIn = () => Boolean(getToken());

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Turn an axios error into a message fit for the UI.
 * FastAPI returns `detail` as a string for HTTP errors and as a list of issues for validation (422) errors.
 */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((issue) => issue.msg).join('; ');
  }
  return fallback;
}

const api = {
  registerUser: (data) => client.post('/users/', data),
  loginUser: (data) => client.post('/users/login', data),
  fetchRooms: () => client.get('/rooms/'),
  createRoom: (data) => client.post('/rooms/', data),
};

export default api;
