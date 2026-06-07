import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { BoxArrowRight, QuestionCircle } from 'react-bootstrap-icons';
import styles from '../assets/scss/TopBar.module.scss';
import { getUserProfile, parseDisplayName } from '../hooks/useUserProfile';

function TopBar() {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const [firstName, setFirstName] = useState("");

    useEffect(() => {
        if (!user) return;
        getUserProfile()
            .then((profile) => setFirstName(profile?.firstName || parseDisplayName(user.displayName).firstName || ""))
            .catch(() => setFirstName(parseDisplayName(user.displayName).firstName || ""));
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
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
                        <div className={styles.userName}>Hi, {firstName || user.email} 👋</div>
                        <div className={styles.userSubtitle}>Good to see you back!</div>
                    </div>
                </div>
                <button className={styles.helpBtn} onClick={() => navigate('/help')} title="Help Center">
                    <QuestionCircle size={20} />
                </button>
                <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                    <BoxArrowRight size={20} />
                </button>
            </div>
        </header>
    );
}

export default TopBar;
