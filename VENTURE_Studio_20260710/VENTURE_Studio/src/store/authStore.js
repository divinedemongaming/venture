/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { create } from 'zustand';
import api from '../services/api';

const MOCK_TOKEN = 'venture_mock_dev';

const MOCK_USER = {
  id: 'dev-001',
  username: 'DivineDemon',
  displayName: 'DivineDemonGaming',
  email: 'dev@divinedemongaming.com',
  avatar: null,
  channelName: 'DivineDemonGaming',
  subscribers: 14200,
  isCreator: true,
  isVerified: true,
  accountType: 'CREATOR',
  streamKey: 'live_sk_abc123xyz_dev',
};

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('venture_access_token') || null,
  loading: false,
  error: null,

  login: async (identifier, password, totpCode) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { identifier, password, ...(totpCode && { totpCode }) });

      if (data.requires2FA) {
        set({ loading: false });
        return { requires2FA: true, userId: data.userId };
      }

      localStorage.setItem('venture_access_token', data.accessToken);
      localStorage.setItem('venture_refresh_token', data.refreshToken);
      set({ user: data.user, accessToken: data.accessToken, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg, attemptsRemaining: err.response?.data?.attemptsRemaining };
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('venture_access_token');
    localStorage.removeItem('venture_refresh_token');
    set({ user: null, accessToken: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('venture_access_token');
    if (!token) return;

    // Dev mode — restore mock user without hitting backend
    if (token === MOCK_TOKEN) {
      set({ user: MOCK_USER, accessToken: MOCK_TOKEN, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      localStorage.removeItem('venture_access_token');
      localStorage.removeItem('venture_refresh_token');
      set({ user: null, accessToken: null, loading: false });
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

  clearError: () => set({ error: null }),

  /* Dev: seed mock user — persists across reloads */
  seedMockUser: () => {
    localStorage.setItem('venture_access_token', MOCK_TOKEN);
    localStorage.setItem('venture_refresh_token', MOCK_TOKEN);
    set({ user: MOCK_USER, accessToken: MOCK_TOKEN, error: null });
  },
}));

export default useAuthStore;
