/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const contentService = {
  /* Content library */
  getLibrary: (params = {}) => api.get('/content/library', { params }),
  getItem: (id) => api.get(`/content/${id}`),
  updateItem: (id, data) => api.put(`/content/${id}`, data),
  deleteItem: (id) => api.delete(`/content/${id}`),
  bulkDelete: (ids) => api.post('/content/bulk-delete', { ids }),
  bulkUnpublish: (ids) => api.post('/content/bulk-unpublish', { ids }),
  publishItem: (id) => api.post(`/content/${id}/publish`),
  unpublishItem: (id) => api.post(`/content/${id}/unpublish`),

  /* Comments */
  getComments: (params = {}) => api.get('/content/comments', { params }),
  approveComment: (id) => api.post(`/content/comments/${id}/approve`),
  rejectComment: (id) => api.post(`/content/comments/${id}/reject`),
  flagComment: (id) => api.post(`/content/comments/${id}/flag`),
  bulkModerate: (ids, action) => api.post('/content/comments/bulk', { ids, action }),

  /* Scheduler */
  getScheduled: () => api.get('/content/scheduled'),
  schedulePost: (data) => api.post('/content/schedule', data),
  updateSchedule: (id, data) => api.put(`/content/schedule/${id}`, data),
  deleteSchedule: (id) => api.delete(`/content/schedule/${id}`),
};

export default contentService;
