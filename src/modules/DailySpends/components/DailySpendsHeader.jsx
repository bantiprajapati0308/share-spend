import React from 'react';
import styles from '../styles/DailySpends.module.scss';

function DailySpendsHeader() {
    return (
        <div className={styles.header}>
            <h1>Daily Spends</h1>
            <p>Track your daily spending and manage your budget</p>
        </div>
    );
}

export default DailySpendsHeader;
