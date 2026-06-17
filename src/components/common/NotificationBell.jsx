import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BellFill } from 'react-bootstrap-icons';
import useNotifications from '../../modules/Trip/hooks/useNotifications';

/**
 * Notification bell icon with unread badge and dropdown list.
 * Renders in TopBar. Clicking a trip_invite notification triggers onInviteClick.
 *
 * Props:
 *   onInviteClick(notification) - called when a trip_invite notification is clicked
 */
function NotificationBell({ onInviteClick }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { markRead, markAllRead } = useNotifications();

    const { notifications, unreadCount } = useSelector((s) => s.notifications);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleNotifClick = (notif) => {
        if (!notif.isRead) markRead(notif.id);
        if (notif.type === 'trip_invite') {
            setOpen(false);
            onInviteClick?.(notif);
        }
    };

    const handleMarkAll = (e) => {
        e.stopPropagation();
        markAllRead();
    };

    const dropdownStyle = {
        position: 'absolute',
        top: '110%',
        right: '-110px',
        width: '300px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
        zIndex: 2000,
        overflow: 'hidden',
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.65rem 1rem',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 700,
        fontSize: '0.9rem',
        color: '#333',
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifications"
                style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    color: '#1e62d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '44px',
                    minHeight: '44px',
                    position: 'relative',
                    marginRight: '4px',
                }}
            >
                <BellFill size={20} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#dc3545',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '17px',
                            height: '17px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={dropdownStyle}>
                    <div style={headerStyle}>
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#1e62d0',
                                    fontSize: '0.78rem',
                                    padding: 0,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '320px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <li style={{ padding: '1.2rem 1rem', color: '#aaa', fontSize: '0.875rem', textAlign: 'center' }}>
                                No notifications
                            </li>
                        ) : (
                            notifications.map((notif) => (
                                <li
                                    key={notif.id}
                                    onClick={() => handleNotifClick(notif)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid #f5f5f5',
                                        cursor: notif.type === 'trip_invite' ? 'pointer' : 'default',
                                        background: notif.isRead ? '#fff' : '#f0f4ff',
                                        transition: 'background 0.15s',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <div style={{ fontWeight: notif.isRead ? 400 : 600, color: '#222', marginBottom: '0.2rem' }}>
                                        {notif.type === 'trip_invite' && (
                                            <span>
                                                You're invited to join{' '}
                                                <strong>{notif.tripName || 'a trip'}</strong>
                                            </span>
                                        )}
                                        {notif.type === 'invite_accepted' && (
                                            <span>
                                                <strong>{notif.acceptedByEmail}</strong> joined{' '}
                                                <strong>{notif.tripName || 'your trip'}</strong>
                                            </span>
                                        )}
                                        {!['trip_invite', 'invite_accepted'].includes(notif.type) && (
                                            <span>New notification</span>
                                        )}
                                    </div>
                                    {!notif.isRead && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '7px',
                                                height: '7px',
                                                borderRadius: '50%',
                                                background: '#1e62d0',
                                                marginRight: '4px',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                    )}
                                    {notif.type === 'trip_invite' && !notif.isRead && (
                                        <span style={{ color: '#1e62d0', fontSize: '0.78rem' }}>Tap to respond →</span>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
