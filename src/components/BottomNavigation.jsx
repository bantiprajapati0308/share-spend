import React from 'react';
import { NavLink } from 'react-router-dom';
import { HouseDoor, Calendar, HandThumbsUp, Speedometer2 } from 'react-bootstrap-icons';
import styles from '../assets/scss/BottomNavigation.module.scss';

function BottomNavigation() {
    return (
        <nav className={styles.bottomNav}>
            <NavLink
                to="/share-spend/trip"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <HouseDoor size={24} />
                <span className={styles.label}>Trip</span>
            </NavLink>

            <NavLink
                to="/share-spend/daily-expenses"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <Calendar size={24} />
                <span className={styles.label}>Daily Spends</span>
            </NavLink>

            <NavLink
                to="/share-spend/limits-manager"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <Speedometer2 size={24} />
                <span className={styles.label}>Limits</span>
            </NavLink>

            <NavLink
                to="/share-spend/lending"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <HandThumbsUp size={24} />
                <span className={styles.label}>Borrow/Lend</span>
            </NavLink>
        </nav>
    );
}

export default BottomNavigation;
