/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const monetizationService = {
  getOverview: () => api.get('/monetization/overview'),
  getTransactions: (params = {}) => api.get('/monetization/transactions', { params }),
  getTiers: () => api.get('/monetization/tiers'),
  updateTier: (id, data) => api.put(`/monetization/tiers/${id}`, data),
  getPayouts: () => api.get('/monetization/payouts'),
  requestPayout: (amount) => api.post('/monetization/payouts/request', { amount }),
  getBalance: () => api.get('/monetization/balance'),
  updatePaymentMethod: (data) => api.post('/monetization/payment-method', data),
};

export default monetizationService;
