import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        unreadCount: 0,
    },
    reducers: {
        setNotifications(state, action) {
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter((n) => !n.isRead).length;
        },
        markNotificationRead(state, action) {
            const notif = state.notifications.find((n) => n.id === action.payload);
            if (notif && !notif.isRead) {
                notif.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllNotificationsRead(state) {
            state.notifications.forEach((n) => { n.isRead = true; });
            state.unreadCount = 0;
        },
    },
});

export const { setNotifications, markNotificationRead, markAllNotificationsRead } =
    notificationSlice.actions;
export default notificationSlice.reducer;
