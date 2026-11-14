import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Screen Wake Lock hook (Modern Web API)
 * Keeps the screen awake during active story reading or kid mode.
 * Automatically releases lock when tab is hidden or component unmounts.
 */
export function useWakeLock(enabled: boolean = true) {
  const [isLocked, setIsLocked] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') {
      return;
    }
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        sentinelRef.current = null;
      });
    } catch {
      // Wake Lock might fail due to battery saver or browser policy
      setIsLocked(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Sentinel release error handled gracefully
      }
      sentinelRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      releaseLock();
      return;
    }

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return { isLocked, isSupported: 'wakeLock' in navigator };
}
