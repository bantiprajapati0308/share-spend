import { NavLink } from 'react-router-dom';
import { HouseDoor, Calendar, HandThumbsUp } from 'react-bootstrap-icons';
import styles from '../assets/scss/BottomNavigation.module.scss';

function BottomNavigation() {
    return (
        <nav className={styles.bottomNav}>
            <NavLink
                to="/daily-expenses"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <Calendar size={16} />
                <span className={styles.label}>Daily Spends</span>
            </NavLink>

            <NavLink
                to="/lending"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <HandThumbsUp size={16} />
                <span className={styles.label}>Borrow/Lent</span>
            </NavLink>
            <NavLink
                to="/trip"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
            >
                <HouseDoor size={16} />
                <span className={styles.label}>Trip</span>
            </NavLink>
        </nav>
    );
}

export default BottomNavigation;
