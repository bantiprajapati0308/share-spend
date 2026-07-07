import { useEffect } from 'react';
import { hasExceededDuration } from '../services/security/activity.service';
import { sessionService } from '../services/security/session.service';

export function useVisibilityTracker({ enabled, isLocked, autoLockAfter, lockOnTabHidden, onTimeout }) {
  useEffect(() => {
    if (!enabled || isLocked || !lockOnTabHidden) return undefined;

    const handleHidden = () => {
      sessionService.setLastBackgroundTime();
      sessionService.setLastActivityTime();
    };

    const handleVisible = () => {
      const backgroundTime = sessionService.getLastBackgroundTime();
      if (hasExceededDuration(backgroundTime, autoLockAfter)) {
        onTimeout?.('background');
      } else {
        sessionService.setLastActivityTime();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleHidden();
      else handleVisible();
    };

    const handleBlur = () => handleHidden();
    const handleFocus = () => handleVisible();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoLockAfter, enabled, isLocked, lockOnTabHidden, onTimeout]);
}
