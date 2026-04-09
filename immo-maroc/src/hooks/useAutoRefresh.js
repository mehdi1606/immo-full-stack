import { useEffect } from 'react';

/**
 * Polls `fetchFn` every `intervalMs` milliseconds while the component is mounted.
 * The initial fetch is handled by the page's own useEffect — this only sets up the interval.
 *
 * @param {() => void} fetchFn   - stable callback (useCallback) that loads fresh data
 * @param {number}     intervalMs - polling interval, default 30 s
 */
export function useAutoRefresh(fetchFn, intervalMs = 30_000) {
  useEffect(() => {
    if (!fetchFn) return;
    const id = setInterval(fetchFn, intervalMs);
    return () => clearInterval(id);
  }, [fetchFn, intervalMs]);
}
