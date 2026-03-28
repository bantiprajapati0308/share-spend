import React from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { BoxArrowRight } from 'react-bootstrap-icons';
import styles from '../assets/scss/TopBar.module.scss';

function TopBar() {
    const navigate = useNavigate();
    const user = auth.currentUser;

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/share-spend/login");
        window.location.reload();
    };

    if (!user) return null;

    return (
        <header className={styles.topBar}>
            <div className={styles.container}>
                <div className={styles.userSection}>
                    {user.photoURL && (
                        <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
                    )}
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.displayName || user.email}</div>
                    </div>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                    <BoxArrowRight size={20} />
                </button>
            </div>
        </header>
    );
}

export default TopBar;
