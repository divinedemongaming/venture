/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { buildKidsPrivacyHeaders, STRIP_TRACKING_PARAMS } from '../utils/kidsSession';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', 'X-Platform': 'mobile' }
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // ── Kids Mode privacy enforcement ──────────────────────────────────────
  // Check if this is a kids session. If so, inject privacy headers and
  // strip any tracking parameters from the request URL.
  const kidsMode = await SecureStore.getItemAsync('venture_kids_mode');
  if (kidsMode === 'true' && token) {
    const privacyHeaders = await buildKidsPrivacyHeaders(token);
    Object.assign(config.headers, privacyHeaders);

    // Strip tracking params from URL query string
    if (config.params) {
      STRIP_TRACKING_PARAMS.forEach(p => delete config.params[p]);
    }

    // Kids sessions never send location, device ID, or analytics context
    delete config.headers['X-Device-ID'];
    delete config.headers['X-Advertising-ID'];
    delete config.headers['X-Analytics-ID'];
    delete config.headers['X-Location'];
  }

  return config;
}, Promise.reject);

// Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefresh);

        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // Clear auth and redirect to login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        useAuthStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── API methods ───────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  oauthCallback: (data) => api.post('/auth/oauth/callback', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (code) => api.post('/auth/2fa/verify', { code }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  registerPushToken: (token) => api.post('/users/me/push-token', { token }),
  updateProfile: (data) => api.patch('/users/me/profile', data),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  block: (userId) => api.post(`/users/${userId}/block`),
  getFollowers: (userId, params) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params) => api.get(`/users/${userId}/following`, { params }),
  getSuggested: () => api.get('/users/discover/suggested'),
  report: (userId, data) => api.post(`/users/${userId}/report`, data),
};

export const postsAPI = {
  create: (data) => api.post('/posts', data),
  get: (postId) => api.get(`/posts/${postId}`),
  delete: (postId) => api.delete(`/posts/${postId}`),
  like: (postId) => api.post(`/posts/${postId}/like`),
  getComments: (postId, params) => api.get(`/posts/${postId}/comments`, { params }),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
  bookmark: (postId) => api.post(`/posts/${postId}/bookmark`),
  getUserPosts: (userId, params) => api.get(`/posts/user/${userId}`, { params }),
};

export const reelsAPI = {
  create: (data) => api.post('/reels', data),
  like: (reelId) => api.post(`/reels/${reelId}/like`),
  delete: (reelId) => api.delete(`/reels/${reelId}`),
};

export const storiesAPI = {
  create: (data) => api.post('/stories', data),
  view: (storyId) => api.post(`/stories/${storyId}/view`),
  getViews: (storyId) => api.get(`/stories/${storyId}/views`),
  delete: (storyId) => api.delete(`/stories/${storyId}`),
};

export const feedAPI = {
  home: (params) => api.get('/feed/home', { params }),
  explore: (params) => api.get('/feed/explore', { params }),
  reels: (params) => api.get('/feed/reels', { params }),
  trending: () => api.get('/feed/trending'),
  stories: () => api.get('/feed/stories'),
  live: (params) => api.get('/feed/live', { params }),
};

export const gamingAPI = {
  getGames: (params) => api.get('/gaming/games', { params }),
  getTrendingGames: () => api.get('/gaming/games/trending'),
  getGame: (slug) => api.get(`/gaming/games/${slug}`),
  createClip: (data) => api.post('/gaming/clips', data),
  getClips: (params) => api.get('/gaming/clips', { params }),
  likeClip: (clipId) => api.post(`/gaming/clips/${clipId}/like`),
  getGamerProfile: (userId) => api.get(`/gaming/profile/${userId}`),
  updateGamerProfile: (data) => api.patch('/gaming/profile', data),
  addToLibrary: (data) => api.post('/gaming/library', data),
  getTournaments: (params) => api.get('/gaming/tournaments', { params }),
  enterTournament: (id, data) => api.post(`/gaming/tournaments/${id}/enter`, data),
  getLeaderboard: () => api.get('/gaming/leaderboard'),
};

export const liveAPI = {
  create: (data) => api.post('/live', data),
  start: (streamId) => api.post(`/live/${streamId}/start`),
  end: (streamId) => api.post(`/live/${streamId}/end`),
  get: (streamId) => api.get(`/live/${streamId}`),
  list: (params) => api.get('/live', { params }),
  getStats: (streamId) => api.get(`/live/${streamId}/stats`),
};

export const messagesAPI = {
  getThreads: () => api.get('/messages/threads'),
  createThread: (data) => api.post('/messages/threads', data),
  getThread: (threadId, params) => api.get(`/messages/threads/${threadId}`, { params }),
  deleteMessage: (messageId) => api.delete(`/messages/messages/${messageId}`),
};

export const monetizationAPI = {
  getCreatorProfile: () => api.get('/monetization/creator/profile'),
  becomeCreator: (data) => api.post('/monetization/creator/become', data),
  updateCreatorProfile: (data) => api.patch('/monetization/creator/profile', data),
  stripeConnect: () => api.post('/monetization/creator/stripe/connect'),
  stripeVerify: () => api.post('/monetization/creator/stripe/verify'),
  createTier: (data) => api.post('/monetization/creator/tiers', data),
  getTiers: (creatorId) => api.get(`/monetization/${creatorId}/tiers`),
  subscribe: (data) => api.post('/monetization/subscribe', data),
  cancelSubscription: (subId) => api.post(`/monetization/subscribe/${subId}/cancel`),
  sendTip: (data) => api.post('/monetization/tip', data),
  getEarnings: (params) => api.get('/monetization/creator/earnings', { params }),
  requestPayout: () => api.post('/monetization/creator/payout'),
  getMySubscriptions: () => api.get('/monetization/my/subscriptions'),
};

export const notificationsAPI = {
  get: (params) => api.get('/notifications', { params }),
  readAll: () => api.post('/notifications/read-all'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.patch('/notifications/preferences', data),
};

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  trendingSearches: () => api.get('/search/trending-searches'),
};

export const importAPI = {
  start: (data) => api.post('/import/start', data),
  getStatus: (jobId) => api.get(`/import/status/${jobId}`),
  getHistory: () => api.get('/import/history'),
  importFollowers: (data) => api.post('/import/followers', data),
  importContent: (data) => api.post('/import/content', data),
  getPlatforms: () => api.get('/import/platforms'),
};

export const uploadAPI = {
  image: async (uri, onProgress) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' });
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
  },
  video: async (uri, onProgress) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'video/mp4', name: 'upload.mp4' });
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
  },
  media: async (files, onProgress) => {
    const formData = new FormData();
    files.forEach((f, i) => formData.append('files', { uri: f.uri, type: f.type || 'image/jpeg', name: `file_${i}` }));
    return api.post('/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
  },
};

export const chatAPI = {
  getRooms: (params) => api.get('/chat/rooms', { params }),
  getRoom: (slug) => api.get(`/chat/rooms/${slug}`),
  joinRoom: (slug) => api.post(`/chat/rooms/${slug}/join`),
  getMessages: (slug, params) => api.get(`/chat/rooms/${slug}/messages`, { params }),
  sendMessage: (slug, data) => api.post(`/chat/rooms/${slug}/messages`, data),
  reportMessage: (messageId, data) => api.post(`/chat/messages/${messageId}/report`, data),
  reactToMessage: (messageId, emoji) => api.post(`/chat/messages/${messageId}/react`, { emoji }),
  deleteMessage: (messageId, reason) => api.delete(`/chat/messages/${messageId}`, { data: { reason } }),
  muteUser: (slug, userId, data) => api.post(`/chat/rooms/${slug}/mute/${userId}`, data),
  banUser: (slug, userId, data) => api.post(`/chat/rooms/${slug}/ban/${userId}`, data),
  lockRoom: (slug, isLocked) => api.patch(`/chat/rooms/${slug}/lock`, { isLocked }),
  getBlocklist: () => api.get('/chat/moderation/blocklist'),
  addToBlocklist: (word, severity) => api.post('/chat/moderation/blocklist', { word, severity }),
  removeFromBlocklist: (word) => api.delete(`/chat/moderation/blocklist/${word}`),
  getFlaggedMessages: () => api.get('/chat/moderation/flagged'),
};

export const kidsAPI = {
  requestConsent: (parentEmail, childName) =>
    api.post('/auth/kids/request-consent', { parentEmail, childName }),
  getConsentStatus: (consentId) =>
    api.get(`/auth/kids/consent-status/${consentId}`),
  createCardVerify: () =>
    api.post('/auth/kids/card-verify/create'),
  completeCardVerify: () =>
    api.post('/auth/kids/card-verify/complete'),
  getFeed: (categories, cursor, limit = 20) =>
    api.get('/feed/kids', { params: { categories: categories?.join(','), cursor, limit } }),
};
