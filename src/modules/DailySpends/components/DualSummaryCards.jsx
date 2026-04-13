import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import styles from './DualSummaryCards.module.scss';
import { formatCurrencyINR } from '../../../Util';
import { useNavigate } from 'react-router-dom';

function DualSummaryCards({
    totalSpend,
    totalIncome,
    spendPercentage,
}) {
    const savedAmount = parseFloat(totalIncome) - parseFloat(totalSpend);
    const isOverspent = savedAmount < 0;
    const displayAmount = Math.abs(savedAmount);
    const overspentPercentage = isOverspent ? ((Math.abs(savedAmount) / totalIncome) * 100) : 0;
    const navigate = useNavigate();
    const handleOpenMasterReport = () => {
        navigate('/share-spend/daily-expenses/master-report');
    };

    return (
        <div className={styles.wrapper}>
            {/* Compact Horizontal Summary */}
            <div className={styles.card}>
                {/* Bootstrap horizontal layout */}
                <div className="d-flex justify-content-around align-items-center mb-4">
                    {/* Income */}
                    <div className="d-flex flex-column align-items-center text-center">
                        <div className={`${styles.iconCircle} ${styles.income} d-flex align-items-center justify-content-center`}>
                            <i className="bi bi-wallet-fill"></i>
                        </div>
                        <div className={styles.value}>
                            {formatCurrencyINR(totalIncome, { showSymbol: false, decimals: 0 })}
                        </div>
                        <div className={styles.label}>Income</div>
                    </div>

                    {/* Expense */}
                    <div onClick={handleOpenMasterReport} className="d-flex flex-column align-items-center text-center">
                        <div className={`${styles.iconCircle} ${styles.expense} d-flex align-items-center justify-content-center`}>
                            <i className="bi bi-graph-up-arrow"></i>
                        </div>
                        <div className={`${styles.value} ${styles.expense}`}>
                            {formatCurrencyINR(totalSpend, { showSymbol: false, decimals: 0 })}
                        </div>
                        <div className={styles.label}>Expense</div>
                    </div>

                    {/* Saved/Overspent */}
                    <div className="d-flex flex-column align-items-center text-center">
                        <div className={`${styles.iconCircle} ${isOverspent ? styles.overspent : styles.saved} d-flex align-items-center justify-content-center`}>
                            <i className={isOverspent ? "bi bi-exclamation-triangle-fill" : "bi bi-piggy-bank-fill"}></i>
                        </div>
                        <div className={`${styles.value} ${isOverspent ? styles.overspent : styles.saved}`}>
                            {formatCurrencyINR(displayAmount, { showSymbol: false, decimals: 0 })}
                        </div>
                        <div className={styles.label}>
                            {isOverspent ? <span className={styles.overspentPercentage}>-{Math.round(overspentPercentage)}%</span> : null} {isOverspent ? 'Overspent' : 'Saved'}
                        </div>
                    </div>
                </div>

                {/* Progress Bar using Bootstrap flex */}
                <div className={`${styles.progressContainer} d-flex align-items-center gap-3`}>
                    <div className={`${styles.progressBar} flex-grow-1`}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                        ></div>
                    </div>
                    <div className={styles.percentage}>
                        {Math.round(spendPercentage)}%
                    </div>
                </div>
            </div>
        </div>
    );
}

DualSummaryCards.propTypes = {
    totalSpend: PropTypes.number.isRequired,
    totalIncome: PropTypes.number.isRequired,
    spendPercentage: PropTypes.number,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    currency: PropTypes.string,
};

export default DualSummaryCards;
