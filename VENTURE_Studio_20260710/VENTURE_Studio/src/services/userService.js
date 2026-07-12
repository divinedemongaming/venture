/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const userService = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getCreatorProfile: () => api.get('/users/me/creator-profile'),
  updateCreatorProfile: (data) => api.put('/users/me/creator-profile', data),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  getNotifPrefs: () => api.get('/users/me/notification-prefs'),
  updateNotifPrefs: (prefs) => api.put('/users/me/notification-prefs', prefs),
  enable2FA: () => api.post('/auth/2fa/setup'),
  confirm2FA: (code) => api.post('/auth/2fa/confirm', { code }),
  disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
  getActiveSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
};

export default userService;
