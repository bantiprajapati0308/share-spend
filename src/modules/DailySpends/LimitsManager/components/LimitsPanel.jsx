import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import styles from '../styles/LimitsManager.module.scss';
import LimitCard from './LimitCard';
import EmptyState from './EmptyState';
import { getLimitsSummary, sortLimitsByUrgency } from '../utils/limitsCalculations';

/**
 * LimitsPanel Component
 * Reusable panel for displaying spend or income limits
 * Handles separate calculations for each type
 */
function LimitsPanel({
    limits,
    categoryTotals,
    limitType = 'spend',
    onAddLimit,
    onEditLimit,
    onDeleteLimit,
    loading = false,
    error = null,
}) {
    const [expandSummary, setExpandSummary] = useState(false);

    // Filter and sort limits by type with memoization
    const typedLimits = useMemo(() => {
        const filtered = limits.filter(limit => (limit.type || 'spend') === limitType);
        return sortLimitsByUrgency(filtered, categoryTotals);
    }, [limits, limitType, categoryTotals]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        return getLimitsSummary(typedLimits, categoryTotals);
    }, [typedLimits, categoryTotals]);

    const typeLabel = limitType === 'income' ? 'Income' : 'Spending';

    if (loading) {
        return (
            <Card className={styles.limitsPanel}>
                <Card.Body className={styles.loadingState}>
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading {typeLabel.toLowerCase()} limits...</span>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className={styles.limitsPanel}>
            {/* Panel Header */}
            <Card.Header className={styles.panelHeader}>
                <div className={styles.headerContent}>
                    <div>
                        <h5 className={styles.panelTitle}>{typeLabel} Limits</h5>
                        <p className={styles.panelSubtitle}>
                            {summary.totalLimits} limit{summary.totalLimits !== 1 ? 's' : ''} • {summary.overLimitCount} over limit
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onAddLimit}
                        className={styles.addLimitBtn}
                    >
                        <Plus size={16} /> Add {typeLabel} Limit
                    </Button>
                </div>
            </Card.Header>

            <Card.Body className={styles.panelBody}>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}

                {/* Summary Section */}
                {summary.totalLimits > 0 && (
                    <div
                        className={styles.summarySection}
                        onClick={() => setExpandSummary(!expandSummary)}
                    >
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total Budget</span>
                            <span className={styles.summaryValue}>
                                ${summary.totalBudget.toFixed(2)}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total Spent</span>
                            <span className={styles.summaryValue}>
                                ${summary.totalSpent.toFixed(2)}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Average Usage</span>
                            <span
                                className={`${styles.summaryValue} ${summary.averageUsage > 100 ? styles.overBudget : ''
                                    }`}
                            >
                                {summary.averageUsage}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Limits List */}
                {typedLimits.length === 0 ? (
                    <EmptyState
                        limitType={limitType}
                        onAddClick={onAddLimit}
                    />
                ) : (
                    <div className={styles.limitsList}>
                        {typedLimits.map((limit) => (
                            <LimitCard
                                key={limit.id}
                                limit={limit}
                                spent={categoryTotals[limit.category] || 0}
                                onEdit={onEditLimit}
                                onDelete={onDeleteLimit}
                            />
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

LimitsPanel.propTypes = {
    limits: PropTypes.array.isRequired,
    categoryTotals: PropTypes.object.isRequired,
    limitType: PropTypes.oneOf(['spend', 'income']).isRequired,
    onAddLimit: PropTypes.func.isRequired,
    onEditLimit: PropTypes.func.isRequired,
    onDeleteLimit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string,
};

export default LimitsPanel;
