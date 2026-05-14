import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Wallet, CashCoin } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import { formatCurrencyINR } from '../../../../Util';
import styles from '../styles/MasterReport.module.scss';

import FullScreenLoader from '../../../../components/common/FullScreenLoader';

/**
 * Time-based Summary Cards Component
 * Shows today's and this week's spending and income data
 * Shows loader overlay when loading
 */
function TimeSummaryCardsSection({ todayData, thisWeekData, currencySymbol, loading, onCardClick }) {
    const formatAmount = (amount) => {
        return formatCurrencyINR(amount);
    };

    const SummaryCard = ({ title, spent, income, spentCount, incomeCount, period }) => (
        <div className={styles.timeSummaryCard}>
            <h5 className={styles.timePeriodTitle}>{title}</h5>
            <Row className="g-2">
                <Col xs={6}>
                    <div
                        className={`${styles.timeCard} ${styles.spentCard}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onCardClick && onCardClick(period, 'spend')}
                        title={`View ${title} Spend Details`}
                    >
                        <div className={styles.cardIcon}>
                            <Wallet size={20} />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>Spent</div>
                            <div className={styles.cardAmount}>
                                {formatAmount(spent)}
                            </div>
                            <div className={styles.cardSubtext}>
                                {spentCount} transaction{spentCount !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={6}>
                    <div
                        className={`${styles.timeCard} ${styles.incomeCard}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onCardClick && onCardClick(period, 'income')}
                        title={`View ${title} Income Details`}
                    >
                        <div className={styles.cardIcon}>
                            <CashCoin size={20} />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>Income</div>
                            <div className={styles.cardAmount}>
                                {formatAmount(income)}
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
        <div className={styles.timeSummarySection} style={{ position: 'relative' }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '1rem',
                }}>
                    <FullScreenLoader />
                </div>
            )}
            <SummaryCard
                title="Today"
                spent={todayData.spent}
                income={todayData.income}
                spentCount={todayData.spendCount}
                incomeCount={todayData.incomeCount}
                period="today"
            />
            <SummaryCard
                title="Last 7 Days"
                spent={thisWeekData.spent}
                income={thisWeekData.income}
                spentCount={thisWeekData.spendCount}
                incomeCount={thisWeekData.incomeCount}
                period="week"
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
    currencySymbol: PropTypes.string,
    loading: PropTypes.bool,
    onCardClick: PropTypes.func
};

export default TimeSummaryCardsSection;