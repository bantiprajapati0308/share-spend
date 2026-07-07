import PropTypes from 'prop-types';
import styles from '../assets/scss/TopBar.module.scss';
import { ShieldLock, Gear, Gift, QuestionCircle, BoxArrowRight, ChevronRight } from 'react-bootstrap-icons';

export default function UserMenu({ user, onClose, onLogout, navigate }) {
    const handleNavigate = (path) => {
        onClose?.();
        if (navigate) navigate(path);
    };

    return (
        <div className={styles.userMenu} role="menu">
            <div className={styles.menuHeader}>
                <div className={styles.menuUserInfo}>
                    <div className={styles.menuUserName}>{user.displayName || user.email}</div>
                    <div className={styles.menuUserEmail}>{user.email}</div>
                </div>
            </div>

            <div className={styles.menuList}>
                <button className={styles.menuItem} onClick={() => handleNavigate('/settings/security')}>
                    <ShieldLock size={18} className={styles.itemIcon} />
                    <span>App Lock</span>
                    <ChevronRight size={14} className={styles.itemChevron} />
                </button>
                <button className={styles.menuItem} onClick={() => handleNavigate('/settings')}>
                    <Gear size={18} className={styles.itemIcon} />
                    <span>Preferences</span>
                </button>
                <button className={styles.menuItem} onClick={() => handleNavigate('/whats-new')}>
                    <Gift size={18} className={styles.itemIcon} />
                    <span>What&apos;s New</span>
                    <span className={styles.whatsNewDot} />
                    <ChevronRight size={14} className={styles.itemChevron} />
                </button>
                <button className={styles.menuItem} onClick={() => handleNavigate('/help')}>
                    <QuestionCircle size={18} className={styles.itemIcon} />
                    <span>Help & Support</span>
                    <ChevronRight size={14} className={styles.itemChevron} />
                </button>
            </div>

            <div className={styles.menuDivider} />

            <div className={styles.menuFooter}>
                <button className={styles.menuItem} onClick={onLogout}>
                    <BoxArrowRight size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

UserMenu.propTypes = {
    user: PropTypes.object.isRequired,
    onClose: PropTypes.func,
    onLogout: PropTypes.func.isRequired,
    navigate: PropTypes.func,
};
