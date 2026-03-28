import React, { useState, useEffect } from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';
import { getCurrencySymbol } from '../../../Util';

function DualSummaryCards({
    totalSpend,
    totalIncome,
    spendPercentage,
    startDate = null,
    endDate = null,
    currency = 'INR'
}) {
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className={styles.dualSummaryContainer}>
            {/* Date range indicator */}
            {startDate && endDate && (
                <div className={styles.dateRangeIndicator}>
                    <Badge bg="info" class={styles.dateBadge}>
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </Badge>
                </div>
            )}
            <Row className="g-4">
                {/* Spend Summary */}
                <Col lg={6}>
                    <div className={styles.summaryCardCompact}>
                        <div className={styles.summaryTop}>
                            <div>
                                <p className={styles.summaryLabel}>Total Spend</p>
                                <h3 className={styles.summaryAmount}>
                                    {currencySymbol}{totalSpend}
                                </h3>
                            </div>
                            <div className={styles.summaryBadge + ' ' + styles.spendBadge}>
                                {spendPercentage}%
                            </div>
                        </div>
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Income Summary */}
                <Col lg={6}>
                    <div className={styles.summaryCardCompact}>
                        <div className={styles.summaryTop}>
                            <div>
                                <p className={styles.summaryLabel}>Total Income</p>
                                <h3 className={styles.summaryAmount + ' ' + styles.incomeAmount}>
                                    {currencySymbol}{totalIncome}
                                </h3>
                            </div>
                            <div className={styles.summaryBadge + ' ' + styles.incomeBadge}>
                                ✓
                            </div>
                        </div>
                        <div className={styles.remainingAmount}>
                            Remaining: <strong>{currencySymbol}{(parseFloat(totalIncome) - parseFloat(totalSpend)).toFixed(2)}</strong>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default DualSummaryCards;
