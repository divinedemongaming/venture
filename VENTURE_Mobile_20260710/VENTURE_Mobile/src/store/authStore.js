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
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { clearKidsSession } from '../utils/kidsSession';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,

  // Legal gate
  legalAccepted: false,
  ageGroup: null,        // 'ADULT' | 'TEEN' | 'KIDS'

  // Kids mode
  isKidsMode: false,
  kidsProfile: null,     // { name, avatar, allowedCategories, dailyLimitMinutes }

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, isAuthenticated: true, token: accessToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false, token: null });
  },

  updateUser: (updates) => set(state => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setLegalAccepted: async (ageGroup) => {
    await SecureStore.setItemAsync('venture_legal_accepted', 'true');
    await SecureStore.setItemAsync('venture_age_group', ageGroup);
    set({ legalAccepted: true, ageGroup });
  },

  // Enter Kids Mode — called after KidsSetupScreen completes
  enterKidsMode: async (kidsProfile) => {
    await SecureStore.setItemAsync('venture_kids_mode', 'true');
    await SecureStore.setItemAsync('venture_kids_profile', JSON.stringify(kidsProfile));
    set({ isKidsMode: true, kidsProfile, legalAccepted: true, ageGroup: 'KIDS' });
  },

  // Exit Kids Mode — requires PIN verification (done before calling this)
  exitKidsMode: async () => {
    await SecureStore.deleteItemAsync('venture_kids_mode');
    await SecureStore.deleteItemAsync('venture_kids_profile');
    // Clear legal acceptance so they go through normal age verification
    await SecureStore.deleteItemAsync('venture_legal_accepted');
    await SecureStore.deleteItemAsync('venture_age_group');
    // Wipe kids HMAC secret — old signatures cannot be replayed
    await clearKidsSession().catch(() => {});
    set({ isKidsMode: false, kidsProfile: null, legalAccepted: false, ageGroup: null });
  },

  updateKidsProfile: async (updates) => {
    const current = get().kidsProfile || {};
    const updated = { ...current, ...updates };
    await SecureStore.setItemAsync('venture_kids_profile', JSON.stringify(updated));
    set({ kidsProfile: updated });
  },

  restoreSession: async () => {
    try {
      // Check kids mode first
      const kidsMode = await SecureStore.getItemAsync('venture_kids_mode');
      if (kidsMode === 'true') {
        const profileRaw = await SecureStore.getItemAsync('venture_kids_profile');
        const kidsProfile = profileRaw ? JSON.parse(profileRaw) : null;
        set({ isKidsMode: true, kidsProfile, legalAccepted: true, ageGroup: 'KIDS', isLoading: false });
        return;
      }

      // Check legal acceptance
      const legalAccepted = await SecureStore.getItemAsync('venture_legal_accepted');
      const ageGroup = await SecureStore.getItemAsync('venture_age_group');

      // Check auth token
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const { authAPI } = require('../services/api');
        const { data } = await authAPI.me();
        set({
          user: data,
          isAuthenticated: true,
          token,
          legalAccepted: legalAccepted === 'true',
          ageGroup: ageGroup || null,
          isLoading: false,
        });
      } else {
        set({
          isLoading: false,
          legalAccepted: legalAccepted === 'true',
          ageGroup: ageGroup || null,
        });
      }
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
