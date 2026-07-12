/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — auth + parental PIN + screen time store
 */
import { create } from 'zustand';
import { authAPI } from '../services/api';

async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin + 'venture_kids_salt_2024');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

const useKidsStore = create((set, get) => ({
  user:        null,
  token:       localStorage.getItem('venture_kids_token'),
  loading:     true,
  pinHash:     localStorage.getItem('venture_kids_pin_hash'),
  kidsProfile: JSON.parse(localStorage.getItem('venture_kids_profile') || 'null'),
  minutesUsed: parseInt(localStorage.getItem('venture_kids_minutes') || '0', 10),
  timesUp:     false,

  checkAuth: async () => {
    const token = localStorage.getItem('venture_kids_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await authAPI.me();
      set({ user: res.data.user, token, loading: false });
    } catch {
      localStorage.removeItem('venture_kids_token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('venture_kids_token', token);
    set({ token, user });
    return user;
  },

  logout: () => { localStorage.removeItem('venture_kids_token'); set({ user: null, token: null }); },

  setPin: async (pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem('venture_kids_pin_hash', hash);
    set({ pinHash: hash });
  },

  verifyPin: async (pin) => {
    const hash = await hashPin(pin);
    return hash === (get().pinHash || localStorage.getItem('venture_kids_pin_hash'));
  },

  setKidsProfile: (profile) => {
    localStorage.setItem('venture_kids_profile', JSON.stringify(profile));
    set({ kidsProfile: profile });
  },

  tickMinute: () => {
    const next = get().minutesUsed + 1;
    localStorage.setItem('venture_kids_minutes', String(next));
    const limit = get().kidsProfile?.dailyLimitMinutes || 0;
    set({ minutesUsed: next, timesUp: limit > 0 && next >= limit });
  },

  extendTime: (extra = 30) => {
    const p = get().kidsProfile;
    if (!p) return;
    const updated = { ...p, dailyLimitMinutes: p.dailyLimitMinutes + extra };
    localStorage.setItem('venture_kids_profile', JSON.stringify(updated));
    set({ kidsProfile: updated, timesUp: false });
  },
}));

export default useKidsStore;
