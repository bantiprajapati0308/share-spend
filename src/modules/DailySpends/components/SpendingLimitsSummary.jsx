
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';

function SpendingLimitsSummary({ limits = [], categoryTotals = {} }) {
    // Calculate aggregate values
    const calculateTotals = () => {
        const totalLimit = limits.reduce((sum, limit) => sum + (limit.limit || 0), 0);
        const totalSpent = limits.reduce((sum, limit) => {
            const spent = categoryTotals[limit.category] || 0;
            return sum + spent;
        }, 0);
        const remaining = totalLimit - totalSpent;
        const spendPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

        return { totalLimit, totalSpent, remaining, spendPercentage };
    };

    const { totalLimit, totalSpent, remaining, spendPercentage } = calculateTotals();

    if (limits.length === 0) {
        return null;
    }

    // Determine color based on spending percentage
    const getStatusColor = () => {
        if (spendPercentage > 100) return '#dc3545'; // danger
        if (spendPercentage > 80) return '#ffc107'; // warning
        return '#28a745'; // success
    };

    return (
        <div className={styles.spendingLimitsSummary}>
            <h5 className={styles.summaryTitle}>� Budget Overview</h5>
            <Container fluid className="px-0">
                <Row className="g-2">
                    {/* Total Spent Card */}
                    <Col xs={6} sm={6} md={3}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryCardLabel}>Spent</div>
                            <div
                                className={styles.summaryCardAmount}
                                style={{ color: getStatusColor() }}
                            >
                                ${totalSpent.toFixed(2)}
                            </div>
                            <div className={styles.summaryCardSubtext}>{spendPercentage}%</div>
                        </div>
                    </Col>

                    {/* Total Limit Card */}
                    <Col xs={6} sm={6} md={3}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryCardLabel}>Limit</div>
                            <div className={styles.summaryCardAmount}>${totalLimit.toFixed(2)}</div>
                            <div className={styles.summaryCardSubtext}>Total</div>
                        </div>
                    </Col>

                    {/* Status Card */}
                    <Col xs={6} sm={6} md={3}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryCardLabel}>Status</div>
                            <div
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(), margin: '0.3rem 0' }}
                            >
                                {spendPercentage > 100 ? '⚠️ Over' : spendPercentage > 80 ? '⚡ High' : '✓ Good'}
                            </div>
                            <div className={styles.summaryCardSubtext}>
                                {limits.length} {limits.length > 1 ? 'limits' : 'limit'}
                            </div>
                        </div>
                    </Col>

                    {/* Remaining Balance Card */}
                    <Col xs={6} sm={6} md={3}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryCardLabel}>Left</div>
                            <div
                                className={styles.summaryCardAmount}
                                style={{ color: remaining >= 0 ? '#28a745' : '#dc3545' }}
                            >
                                ${Math.abs(remaining).toFixed(2)}
                            </div>
                            <div className={styles.summaryCardSubtext}>
                                {remaining >= 0 ? '✓ Okay' : 'Over'}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Progress Bar */}
            <div className={styles.overallProgressContainer}>
                <div className={styles.progressBarLabel}>
                    <span>Budget Usage</span>
                    <span className={styles.progressPercentage}>{spendPercentage}%</span>
                </div>
                <div className={styles.overallProgressBar}>
                    <div
                        className={styles.overallProgressFill}
                        style={{
                            width: `${Math.min(spendPercentage, 100)}%`,
                            backgroundColor: getStatusColor(),
                        }}
                    />
                </div>
            </div>

            {/* Warning Messages */}
            {spendPercentage > 100 && (
                <div className={styles.overBudgetAlert}>
                    <span>⚠️ Over by ${(totalSpent - totalLimit).toFixed(2)}</span>
                </div>
            )}
            {spendPercentage > 80 && spendPercentage <= 100 && (
                <div className={styles.warningAlert}>
                    <span>📌 {spendPercentage}% used. ${remaining.toFixed(2)} left.</span>
                </div>
            )}
        </div>
    );
}

SpendingLimitsSummary.propTypes = {
    limits: PropTypes.array,
    categoryTotals: PropTypes.object,
};

export default SpendingLimitsSummary;
