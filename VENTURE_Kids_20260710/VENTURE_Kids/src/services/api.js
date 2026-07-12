/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — API service (COPPA compliant: DNT always on, no tracking)
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'X-Kids-Mode': '1', 'DNT': '1', 'Sec-GPC': '1' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('venture_kids_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (cfg.params) {
    const clean = { ...cfg.params };
    ['utm_source','utm_medium','utm_campaign','fbclid','gclid','_ga'].forEach(k => delete clean[k]);
    cfg.params = clean;
  }
  return cfg;
});

export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

export const kidsAPI = {
  getFeed: (categories, cursor, limit = 20) =>
    api.get('/feed/kids', { params: { categories: categories?.join(','), cursor, limit } }),
};

export const postsAPI = {
  get:    (id) => api.get(`/posts/${id}`),
  like:   (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
};

export default api;
