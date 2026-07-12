/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getOverview: (range = '30d') => api.get('/analytics/overview', { params: { range } }),
  getViews: (range = '30d') => api.get('/analytics/views', { params: { range } }),
  getRevenue: (range = '30d') => api.get('/analytics/revenue', { params: { range } }),
  getTopContent: (limit = 10) => api.get('/analytics/top-content', { params: { limit } }),
  getTrafficSources: () => api.get('/analytics/traffic-sources'),
  getSubscribers: (range = '30d') => api.get('/analytics/subscribers', { params: { range } }),
  getAudience: () => api.get('/analytics/audience'),
};

export default analyticsService;
