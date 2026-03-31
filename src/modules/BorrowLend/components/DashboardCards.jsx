import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/BorrowLend.module.scss';
import { getCurrencySymbol } from '../../../Util';

function DashboardCards({ totalGiven, totalTaken, netBalance }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className={styles.dashboardGrid}>
            <div className={`${styles.dashboardCard} ${styles.gave}`}>
                <div className={styles.cardIcon}>
                    💸
                </div>
                <div className={styles.cardLabel}>Total Lent</div>
                <div className={styles.cardValue}>
                    {currencySymbol}{totalGiven}
                </div>
            </div>

            <div className={`${styles.dashboardCard} ${styles.took}`}>
                <div className={styles.cardIcon}>
                    📥
                </div>
                <div className={styles.cardLabel}>Total Borrowed</div>
                <div className={styles.cardValue}>
                    {currencySymbol}{totalTaken}
                </div>
            </div>

            <div className={`${styles.dashboardCard} ${styles.balance}`}>
                <div className={styles.cardIcon}>
                    💰
                </div>
                <div className={styles.cardLabel}>Net Balance</div>
                <div className={styles.cardValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                    {currencySymbol}{netBalance}
                </div>
            </div>
        </div>
    );
}

DashboardCards.propTypes = {
    totalGiven: PropTypes.number.isRequired,
    totalTaken: PropTypes.number.isRequired,
    netBalance: PropTypes.number.isRequired,
};

export default DashboardCards;
