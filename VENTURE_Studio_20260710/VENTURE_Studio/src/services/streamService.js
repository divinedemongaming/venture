/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const streamService = {
  createStream: (data) => api.post('/live/create', data),
  goLive: (streamId) => api.post(`/live/${streamId}/start`),
  endStream: (streamId) => api.post(`/live/${streamId}/end`),
  getStreamInfo: (streamId) => api.get(`/live/${streamId}`),
  getMyStreams: () => api.get('/live/my-streams'),
  updateStream: (streamId, data) => api.put(`/live/${streamId}`, data),
  regenerateKey: () => api.post('/live/regenerate-key'),
  getStreamKey: () => api.get('/live/stream-key'),
  getViewerCount: (streamId) => api.get(`/live/${streamId}/viewers`),
};

export default streamService;
