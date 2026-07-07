/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { auth } from '../firebase';
import { useAutoLock } from '../hooks/useAutoLock';
import { useSessionLock } from '../hooks/useSessionLock';
import { useVisibilityTracker } from '../hooks/useVisibilityTracker';
import { isReloadNavigation } from '../services/security/activity.service';
import { securityService } from '../services/security/security.service';
import { sessionService } from '../services/security/session.service';

export const SecurityContext = createContext(null);

export function SecurityProvider({ user, children }) {
    const [settings, setSettings] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { lock, unlock } = useSessionLock(setIsLocked);

    const refreshSettings = useCallback(async () => {
        if (!user?.uid) return null;
        const nextSettings = await securityService.getAppLock(user.uid);
        setSettings(nextSettings);
        return nextSettings;
    }, [user?.uid]);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            setIsLoading(true);
            setError('');
            try {
                const nextSettings = await securityService.getAppLock(user.uid);
                if (cancelled) return;

                setSettings(nextSettings);
                if (!nextSettings.enabled) {
                    sessionService.clear();
                    setIsLocked(false);
                    return;
                }

                const mustLockForRefresh = nextSettings.lockOnRefresh && isReloadNavigation();
                const canUseSession = sessionService.isUnlocked() && !mustLockForRefresh;
                setIsLocked(!canUseSession);
            } catch (err) {
                if (cancelled) return;
                setError(err.message || 'Security settings could not be loaded.');
                setSettings({ enabled: false, autoLockAfter: 60, lockOnTabHidden: true, lockOnRefresh: true });
                setIsLocked(false);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        if (user?.uid) bootstrap();
        return () => {
            cancelled = true;
        };
    }, [user?.uid]);

    useAutoLock({
        enabled: Boolean(settings?.enabled),
        isLocked,
        autoLockAfter: settings?.autoLockAfter ?? 60,
        lock,
    });

    useVisibilityTracker({
        enabled: Boolean(settings?.enabled),
        isLocked,
        autoLockAfter: settings?.autoLockAfter ?? 60,
        lockOnTabHidden: settings?.lockOnTabHidden ?? true,
        onTimeout: lock,
    });

    const verifyPin = useCallback(
        async (pin) => {
            const result = await securityService.verifyPin(user.uid, pin);
            if (result.success) {
                unlock();
                if (result.settings) {
                    setSettings(result.settings);
                }
            }
            return result;
        },
        [unlock, user?.uid]
    );

    const enableLock = useCallback(
        async (pin, options) => {
            const nextSettings = await securityService.enableAppLock(user.uid, pin, options);
            setSettings(nextSettings);
            unlock();
            toast.success('App Lock is enabled.');
            return nextSettings;
        },
        [unlock, user?.uid]
    );

    const disableLock = useCallback(async () => {
        const nextSettings = await securityService.disableAppLock(user.uid);
        setSettings(nextSettings);
        sessionService.clear();
        setIsLocked(false);
        toast.success('App Lock is disabled.');
        return nextSettings;
    }, [user?.uid]);

    const changePin = useCallback(
        async (currentPin, nextPin) => {
            const result = await securityService.changePin(user.uid, currentPin, nextPin);
            if (result.success && result.settings) {
                setSettings(result.settings);
            }
            return result;
        },
        [user?.uid]
    );

    const resetPin = useCallback(
        async (password, nextPin) => {
            const nextSettings = await securityService.resetPin(auth.currentUser, password, nextPin, settings);
            setSettings(nextSettings);
            unlock();
            return nextSettings;
        },
        [unlock, settings]
    );

    const updateAutoLock = useCallback(
        async (seconds) => {
            const nextSettings = await securityService.updateAutoLock(user.uid, seconds);
            setSettings(nextSettings);
            return nextSettings;
        },
        [user?.uid]
    );

    const updatePreferences = useCallback(
        async (updates) => {
            const nextSettings = await securityService.updateAppLockPreferences(user.uid, updates);
            setSettings(nextSettings);
            return nextSettings;
        },
        [user?.uid]
    );

    const value = useMemo(
        () => ({
            settings,
            isLocked,
            isLoading,
            error,
            lock,
            unlock,
            verifyPin,
            enableLock,
            disableLock,
            changePin,
            resetPin,
            updateAutoLock,
            updatePreferences,
            refreshSettings,
        }),
        [changePin, disableLock, enableLock, error, isLoading, isLocked, lock, refreshSettings, resetPin, settings, unlock, updateAutoLock, updatePreferences, verifyPin]
    );

    return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}
