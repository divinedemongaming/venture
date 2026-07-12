/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useCallback } from 'react';
import { useAsync } from './useAsync';
import contentService from '../services/contentService';

const MOCK = [
  { id: 1, user: 'xX_DarkLord_Xx', avatar: 'D', comment: 'Bro that clutch was insane!!!', video: 'Warzone Solo Win', time: '2 hrs ago', status: 'pending', flagged: false },
  { id: 2, user: 'ProGamer99', avatar: 'P', comment: 'Can you do a settings video?', video: 'Setup Tour', time: '4 hrs ago', status: 'pending', flagged: false },
  { id: 3, user: 'SpamBot_123', avatar: 'S', comment: 'Click here for free V-Bucks!!! bit.ly/xyz', video: 'Diamond Push', time: '5 hrs ago', status: 'pending', flagged: true },
  { id: 4, user: 'NightOwl', avatar: 'N', comment: 'W content as always 🔥', video: 'Tournament Highlights', time: '6 hrs ago', status: 'approved', flagged: false },
  { id: 5, user: 'HaterGuy', avatar: 'H', comment: 'This is trash stop streaming', video: 'New Map First Look', time: '8 hrs ago', status: 'pending', flagged: true },
];

export function useComments() {
  const result = useAsync(() => contentService.getComments(), MOCK);

  const approve = useCallback(async (id) => {
    try { await contentService.approveComment(id); result.refetch(); } catch {}
  }, [result.refetch]);

  const reject = useCallback(async (id) => {
    try { await contentService.rejectComment(id); result.refetch(); } catch {}
  }, [result.refetch]);

  const flag = useCallback(async (id) => {
    try { await contentService.flagComment(id); result.refetch(); } catch {}
  }, [result.refetch]);

  const bulkModerate = useCallback(async (ids, action) => {
    try { await contentService.bulkModerate(ids, action); result.refetch(); } catch {}
  }, [result.refetch]);

  return { ...result, approve, reject, flag, bulkModerate };
}
