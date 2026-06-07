import PropTypes from 'prop-types';
import styles from '../styles/TopSection.module.scss';
import { formatCurrencyINR } from '../../../Util';

function TopSection({ totalGiven, totalTaken, netBalance, givenCount, takenCount, onAddClick }) {
    const isPositive = netBalance >= 0;

    return (
        <div className={styles.topSection}>
            <div className={styles.cardGrid}>

                {/* Total to Receive */}
                <div className={styles.card}>
                    <div className={`${styles.iconWrap} ${styles.iconWrapGreen}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <polyline points="19 12 12 19 5 12" />
                        </svg>
                    </div>
                    <span className={styles.cardLabel}>Total to Receive</span>
                    <span className={`${styles.cardAmount} ${styles.amountGreen}`}>
                        {formatCurrencyINR(totalGiven)}
                    </span>
                    <span className={styles.cardSub}>
                        from {givenCount} {givenCount === 1 ? 'person' : 'people'} &rsaquo;
                    </span>
                </div>

                {/* Total to Pay */}
                <div className={styles.card}>
                    <div className={`${styles.iconWrap} ${styles.iconWrapRed}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                        </svg>
                    </div>
                    <span className={styles.cardLabel}>Total to Pay</span>
                    <span className={`${styles.cardAmount} ${styles.amountRed}`}>
                        {formatCurrencyINR(totalTaken)}
                    </span>
                    <span className={styles.cardSub}>
                        to {takenCount} {takenCount === 1 ? 'person' : 'people'} &rsaquo;
                    </span>
                </div>

                {/* My Balance */}
                <div className={`${styles.card} ${isPositive ? styles.balancePos : styles.balanceNeg}`}>
                    <div className={styles.balanceFace}>
                        {isPositive ? '😊' : '😢'}
                    </div>
                    <span className={styles.cardLabel}>My Balance</span>
                    <span className={`${styles.cardAmount} ${isPositive ? styles.amountGreen : styles.amountRed}`}>
                        {isPositive ? '' : '-'}{formatCurrencyINR(Math.abs(netBalance))}
                    </span>
                    <span className={styles.cardSub}>
                        {isPositive ? 'You will receive' : 'You owe more'}
                    </span>
                </div>

            </div>

            <button className={styles.addButton} onClick={onAddClick}>
                + New Transaction
            </button>
        </div>
    );
}

TopSection.propTypes = {
    totalGiven: PropTypes.number.isRequired,
    totalTaken: PropTypes.number.isRequired,
    netBalance: PropTypes.number.isRequired,
    givenCount: PropTypes.number.isRequired,
    takenCount: PropTypes.number.isRequired,
    onAddClick: PropTypes.func.isRequired,
};

export default TopSection;
