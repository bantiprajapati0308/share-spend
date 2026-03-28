import React from 'react';
import { HandThumbsUp, HandThumbsDown } from 'react-bootstrap-icons';
import styles from '../styles/BorrowLend.module.scss';
import { getCurrencySymbol } from '../../../Util';

function DashboardCards({ totalLent, totalBorrowed, netBalance }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className={styles.dashboardGrid}>
            <div className={`${styles.dashboardCard} ${styles.lent}`}>
                <div className={styles.cardIcon}>
                    <HandThumbsUp size={40} />
                </div>
                <div className={styles.cardLabel}>Total Lent</div>
                <div className={styles.cardValue}>
                    {currencySymbol}{totalLent}
                </div>
            </div>

            <div className={`${styles.dashboardCard} ${styles.borrowed}`}>
                <div className={styles.cardIcon}>
                    <HandThumbsDown size={40} />
                </div>
                <div className={styles.cardLabel}>Total Borrowed</div>
                <div className={styles.cardValue}>
                    {currencySymbol}{totalBorrowed}
                </div>
            </div>

            <div className={`${styles.dashboardCard} ${styles.balance}`}>
                <div className={styles.cardIcon}>
                    💰
                </div>
                <div className={styles.cardLabel}>Net Balance</div>
                <div className={styles.cardValue}>
                    {currencySymbol}{netBalance}
                </div>
            </div>
        </div>
    );
}

export default DashboardCards;
