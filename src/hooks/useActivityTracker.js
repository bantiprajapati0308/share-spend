import { useEffect } from 'react';
import { ACTIVITY_EVENTS } from '../services/security/activity.service';
import { sessionService } from '../services/security/session.service';

export function useActivityTracker({ enabled, isLocked, autoLockAfter, onTimeout }) {
  useEffect(() => {
    if (!enabled || isLocked || autoLockAfter < 0) return undefined;

    const recordActivity = () => sessionService.setLastActivityTime();
    recordActivity();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    const timer = window.setInterval(() => {
      const lastActivityTime = sessionService.getLastActivityTime();
      if (lastActivityTime && Date.now() - lastActivityTime > autoLockAfter * 1000) {
        onTimeout?.('inactivity');
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
    };
  }, [autoLockAfter, enabled, isLocked, onTimeout]);
}
