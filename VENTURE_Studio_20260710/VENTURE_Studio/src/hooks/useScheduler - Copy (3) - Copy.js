/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useCallback } from 'react';
import { useAsync } from './useAsync';
import contentService from '../services/contentService';

const MOCK = [
  { id: 1, title: 'Clutch Clips Vol.3', type: 'reel', date: '2024-07-20', time: '12:00 PM', status: 'Scheduled' },
  { id: 2, title: 'Season 5 Premiere VOD', type: 'video', date: '2024-07-22', time: '6:00 PM', status: 'Scheduled' },
  { id: 3, title: 'Weekly Stream', type: 'stream', date: '2024-07-25', time: '8:00 PM', status: 'Scheduled' },
  { id: 4, title: 'Community Highlights', type: 'video', date: '2024-07-28', time: '3:00 PM', status: 'Scheduled' },
];

export function useScheduler() {
  const result = useAsync(() => contentService.getScheduled(), MOCK);

  const schedule = useCallback(async (data) => {
    try { await contentService.schedulePost(data); result.refetch(); return { success: true }; }
    catch (err) { return { success: false, error: err.response?.data?.error }; }
  }, [result.refetch]);

  const remove = useCallback(async (id) => {
    try { await contentService.deleteSchedule(id); result.refetch(); } catch {}
  }, [result.refetch]);

  return { ...result, schedule, remove };
}
