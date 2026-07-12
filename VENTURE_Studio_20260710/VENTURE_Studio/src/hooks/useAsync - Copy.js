/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';

const MOCK_TOKEN = 'venture_mock_dev';

/**
 * Generic async data fetching hook.
 * Returns { data, loading, error, refetch }.
 * In dev mode (mock token), returns mockData immediately.
 */
export function useAsync(asyncFn, mockData = null, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isMock = accessToken === MOCK_TOKEN;

  const run = useCallback(async () => {
    if (isMock) {
      setData(mockData);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await asyncFn();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [isMock, ...deps]);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

export default useAsync;
