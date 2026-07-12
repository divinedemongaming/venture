/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useState, useCallback } from 'react';
import { useAsync } from './useAsync';
import contentService from '../services/contentService';

const MOCK_CONTENT = [
  { id: 1, title: 'Epic Warzone Solo Win', type: 'video', status: 'Published', views: '142K', date: '2024-06-15', duration: '18:42' },
  { id: 2, title: 'Ranked Grind — Diamond Push', type: 'video', status: 'Published', views: '98K', date: '2024-06-12', duration: '2:14:08' },
  { id: 3, title: 'Weekend Tournament Highlights', type: 'reel', status: 'Published', views: '67K', date: '2024-06-10', duration: '0:58' },
  { id: 4, title: 'New Map First Look', type: 'video', status: 'Draft', views: '—', date: '2024-06-08', duration: '22:15' },
  { id: 5, title: 'Setup Tour 2024', type: 'video', status: 'Processing', views: '—', date: '2024-06-07', duration: '12:30' },
  { id: 6, title: 'Clutch Clips Vol.3', type: 'reel', status: 'Scheduled', views: '—', date: '2024-06-20', duration: '1:12' },
  { id: 7, title: 'Stream Promo Banner', type: 'image', status: 'Published', views: '8.4K', date: '2024-06-05', duration: '—' },
  { id: 8, title: 'Season 5 Teaser', type: 'video', status: 'Unlisted', views: '2.1K', date: '2024-06-01', duration: '0:45' },
];

export function useContent(params = {}) {
  const result = useAsync(() => contentService.getLibrary(params), MOCK_CONTENT);

  const deleteItem = useCallback(async (id) => {
    try { await contentService.deleteItem(id); result.refetch(); } catch {}
  }, [result.refetch]);

  const bulkDelete = useCallback(async (ids) => {
    try { await contentService.bulkDelete(ids); result.refetch(); } catch {}
  }, [result.refetch]);

  const bulkUnpublish = useCallback(async (ids) => {
    try { await contentService.bulkUnpublish(ids); result.refetch(); } catch {}
  }, [result.refetch]);

  return { ...result, deleteItem, bulkDelete, bulkUnpublish };
}
