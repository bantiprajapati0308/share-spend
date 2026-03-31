import PropTypes from 'prop-types';
import styles from '../styles/TopSection.module.scss';
import { getCurrencySymbol } from '../../../Util';
import { formatLargeNumber } from '../utils/numberFormatter';

function TopSection({ totalGiven, totalTaken, netBalance, onAddClick }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className={styles.topSection}>
            {/* Dashboard Cards */}
            <div className={styles.dashboardGrid}>
                <div className={`${styles.dashboardCard} ${styles.willGet}`}>
                    <div className={styles.cardIcon}>💸</div>
                    <div className={styles.cardLabel}>You Will Get</div>
                    <div className={styles.cardValue}>
                        {currencySymbol}{formatLargeNumber(totalGiven)}
                    </div>
                </div>

                <div className={`${styles.dashboardCard} ${styles.owe}`}>
                    <div className={styles.cardIcon}>💰</div>
                    <div className={styles.cardLabel}>You Owe</div>
                    <div className={styles.cardValue}>
                        {currencySymbol}{formatLargeNumber(totalTaken)}
                    </div>
                </div>

                <div className={`${styles.dashboardCard} ${styles.balance}`}>
                    <div className={styles.cardIcon}>⚖️</div>
                    <div className={styles.cardLabel}>Net Balance</div>
                    <div className={styles.cardValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                        {currencySymbol}{formatLargeNumber(netBalance)}
                    </div>
                </div>
            </div>

            {/* Add Transaction Button */}
            <button className={styles.addButton} onClick={onAddClick}>
                <span className={styles.icon}>+</span>
                Add Transaction
            </button>
        </div>
    );
}

TopSection.propTypes = {
    totalGiven: PropTypes.number.isRequired,
    totalTaken: PropTypes.number.isRequired,
    netBalance: PropTypes.number.isRequired,
    onAddClick: PropTypes.func.isRequired,
};

export default TopSection;
