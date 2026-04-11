import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Wallet, CashCoin } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';

/**
 * Time-based Summary Cards Component
 * Shows today's and this week's spending and income data
 */
function TimeSummaryCardsSection({ todayData, thisWeekData, currencySymbol }) {
    const formatAmount = (amount) => {
        return amount.toFixed(2);
    };

    const SummaryCard = ({ title, spent, income, spentCount, incomeCount }) => (
        <div className={styles.timeSummaryCard}>
            <h5 className={styles.timePeriodTitle}>{title}</h5>
            <Row className="g-2">
                <Col xs={6}>
                    <div className={`${styles.timeCard} ${styles.spentCard}`}>
                        <div className={styles.cardIcon}>
                            <Wallet size={20} />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>Spent</div>
                            <div className={styles.cardAmount}>
                                {currencySymbol}{formatAmount(spent)}
                            </div>
                            <div className={styles.cardSubtext}>
                                {spentCount} transaction{spentCount !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={6}>
                    <div className={`${styles.timeCard} ${styles.incomeCard}`}>
                        <div className={styles.cardIcon}>
                            <CashCoin size={20} />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>Income</div>
                            <div className={styles.cardAmount}>
                                {currencySymbol}{formatAmount(income)}
                            </div>
                            <div className={styles.cardSubtext}>
                                {incomeCount} transaction{incomeCount !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );

    return (
        <div className={styles.timeSummarySection}>
            <SummaryCard
                title="Today"
                spent={todayData.spent}
                income={todayData.income}
                spentCount={todayData.spendCount}
                incomeCount={todayData.incomeCount}
            />
            
            <SummaryCard
                title="Last 7 Days"
                spent={thisWeekData.spent}
                income={thisWeekData.income}
                spentCount={thisWeekData.spendCount}
                incomeCount={thisWeekData.incomeCount}
            />
        </div>
    );
}

TimeSummaryCardsSection.propTypes = {
    todayData: PropTypes.shape({
        spent: PropTypes.number.isRequired,
        income: PropTypes.number.isRequired,
        spendCount: PropTypes.number.isRequired,
        incomeCount: PropTypes.number.isRequired
    }).isRequired,
    thisWeekData: PropTypes.shape({
        spent: PropTypes.number.isRequired,
        income: PropTypes.number.isRequired,
        spendCount: PropTypes.number.isRequired,
        incomeCount: PropTypes.number.isRequired
    }).isRequired,
    currencySymbol: PropTypes.string.isRequired
};

export default TimeSummaryCardsSection;