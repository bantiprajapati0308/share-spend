import apiClient from '../apiClient';

export const notificationsApi = {
    /** Fetch all notifications for the current user. */
    getNotifications: () => apiClient.get('/api/notifications'),

    /** Mark a single notification as read. */
    markRead: (notificationId) =>
        apiClient.patch(`/api/notifications/${notificationId}/read`, {}),

    /** Mark all unread notifications as read. */
    markAllRead: () => apiClient.patch('/api/notifications/read-all', {}),
};
