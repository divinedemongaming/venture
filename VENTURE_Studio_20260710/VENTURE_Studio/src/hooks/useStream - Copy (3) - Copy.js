/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useCallback } from 'react';
import { useAsync } from './useAsync';
import streamService from '../services/streamService';

const MOCK = {
  streamKey: 'live_sk_abc123xyz_dev',
  rtmpUrl: 'rtmp://live.venture.app/stream',
  recentStreams: [],
};

export function useStreamInfo() {
  const result = useAsync(() => streamService.getStreamKey(), MOCK);

  const regenerateKey = useCallback(async () => {
    try { await streamService.regenerateKey(); result.refetch(); return { success: true }; }
    catch (err) { return { success: false, error: err.response?.data?.error }; }
  }, [result.refetch]);

  return { ...result, regenerateKey };
}
