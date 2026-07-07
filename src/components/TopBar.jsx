import { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '../assets/scss/TopBar.module.scss';
import { getUserProfile, parseDisplayName } from '../hooks/useUserProfile';
import NotificationBell from './common/NotificationBell';
import UserMenu from './UserMenu';

function TopBar({ onInviteNotificationClick }) {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        if (!user) return;
        getUserProfile()
            .then((profile) => setFirstName(profile?.firstName || parseDisplayName(user.displayName).firstName || ""))
            .catch(() => setFirstName(parseDisplayName(user.displayName).firstName || ""));
    }, [user]);

    const [menuOpen, setMenuOpen] = useState(false);
    const avatarRef = useRef(null);

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
        window.location.reload();
    };

    const toggleMenu = () => setMenuOpen((s) => !s);

    useEffect(() => {
        function onDoc(e) {
            if (!avatarRef.current) return;
            if (!avatarRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, [menuOpen]);

    if (!user) return null;

    return (
        <header className={styles.topBar}>
            <div className={styles.container}>
                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>Hi, {firstName || user.email} 👋</div>
                        <div className={styles.userSubtitle}>Good to see you back!</div>
                    </div>
                </div>
                <div className={styles.rightSection}>
                    <NotificationBell onInviteClick={onInviteNotificationClick} />
                    <div className={styles.avatarWrapper} ref={avatarRef}>
                        <button className={styles.avatarBtn} onClick={toggleMenu} aria-haspopup="menu" aria-expanded={menuOpen}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>{(firstName || user.email || '').charAt(0).toUpperCase()}</div>
                            )}
                            <span className={styles.chevron}>▼</span>
                        </button>
                        {menuOpen && (
                            <UserMenu
                                user={user}
                                onClose={() => setMenuOpen(false)}
                                onLogout={handleLogout}
                                navigate={navigate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default TopBar;

TopBar.propTypes = {
    onInviteNotificationClick: PropTypes.func,
};
