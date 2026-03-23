import { useEffect, useRef } from 'react';

/**
 * Acquires a Screen Wake Lock while `active` is true.
 * Automatically re-acquires when the page becomes visible again
 * (the lock is released by the browser when the page is hidden).
 * Silently no-ops on browsers that don't support the API.
 */
export function useWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let cancelled = false;

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Permission denied or API unavailable — ignore silently.
      }
    }

    function onVisibilityChange() {
      if (!document.hidden && !cancelled) acquire();
    }

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
