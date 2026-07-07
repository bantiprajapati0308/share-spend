import { useCallback } from 'react';
import { sessionService } from '../services/security/session.service';

export function useSessionLock(setIsLocked) {
  const lock = useCallback(() => {
    sessionService.lock();
    setIsLocked(true);
  }, [setIsLocked]);

  const unlock = useCallback(() => {
    sessionService.unlock();
    setIsLocked(false);
  }, [setIsLocked]);

  return { lock, unlock };
}
