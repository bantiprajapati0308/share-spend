import { useCallback } from 'react';
import { useActivityTracker } from './useActivityTracker';

export function useAutoLock({ enabled, isLocked, autoLockAfter, lock }) {
  const handleTimeout = useCallback(() => {
    lock();
  }, [lock]);

  useActivityTracker({
    enabled,
    isLocked,
    autoLockAfter,
    onTimeout: handleTimeout,
  });
}
