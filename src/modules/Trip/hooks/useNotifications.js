import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { notificationsApi } from '../../../services/api/notificationsApi';
import {
    setNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from '../../../redux/notificationSlice';

/**
 * Loads notifications for the current user into Redux store.
 * Exposes markRead and markAllRead helpers that update both the API and store.
 */
function useNotifications() {
    const dispatch = useDispatch();

    const fetchNotifications = useCallback(async () => {
        const result = await notificationsApi.getNotifications();
        if (result.success) {
            dispatch(setNotifications(result.data || []));
        }
    }, [dispatch]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markRead = useCallback(async (notificationId) => {
        dispatch(markNotificationRead(notificationId));
        await notificationsApi.markRead(notificationId).catch(() => {
            // Optimistic update already applied — non-critical if API call fails
        });
    }, [dispatch]);

    const markAllRead = useCallback(async () => {
        dispatch(markAllNotificationsRead());
        await notificationsApi.markAllRead().catch(() => { });
    }, [dispatch]);

    return { fetchNotifications, markRead, markAllRead };
}

export default useNotifications;
