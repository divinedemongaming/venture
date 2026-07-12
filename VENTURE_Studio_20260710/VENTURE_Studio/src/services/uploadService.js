/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import api from './api';

export const uploadService = {
  /**
   * Upload a video/image file with metadata.
   * Uses multipart/form-data — progress callback receives 0-100.
   */
  upload: (file, metadata, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', metadata.title || file.name);
    form.append('description', metadata.description || '');
    form.append('tags', JSON.stringify(metadata.tags || []));
    form.append('visibility', metadata.visibility || 'public');
    form.append('category', metadata.category || 'gaming');
    form.append('allowComments', String(metadata.allowComments !== false));
    form.append('monetize', String(metadata.monetize !== false));
    if (metadata.scheduledDate) form.append('scheduledFor', metadata.scheduledDate);

    return api.post('/upload/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  uploadThumbnail: (file, contentId) => {
    const form = new FormData();
    form.append('thumbnail', file);
    form.append('contentId', contentId);
    return api.post('/upload/thumbnail', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default uploadService;
