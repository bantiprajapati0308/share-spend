import React from 'react';
import styles from '../styles/DailySpends.module.scss';
import { getCurrencySymbol } from '../../../Util';

function SummaryCard({ totalExpenses }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    if (totalExpenses === '0.00') return null;

    return (
        <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Spent This Month</div>
            <div className={styles.summaryAmount}>
                {currencySymbol}{totalExpenses}
            </div>
        </div>
    );
}

export default SummaryCard;
