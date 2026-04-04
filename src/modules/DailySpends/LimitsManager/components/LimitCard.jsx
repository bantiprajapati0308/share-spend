import PropTypes from 'prop-types';
import { Button, Badge } from 'react-bootstrap';
import { Trash2, Pencil } from 'react-bootstrap-icons';
import styles from '../styles/LimitsManager.module.scss';
import {
    calculateLimitPercentage,
    calculateRemaining,
    calculateOverLimit,
    getStatusVariant,
    getStatusText,
    getStatusVariantForIncome,
    getStatusTextForIncome,
    formatCurrency,
} from '../utils/limitsCalculations';
import GradientProgressBar from '../../components/GradientProgressBar';

/**
 * LimitCard Component
 * Displays a single limit with progress and actions
 */
function LimitCard({ limit, spent, onEdit, onDelete, limitType = 'spend' }) {
    const percentage = calculateLimitPercentage(spent, limit.limit);
    const progressPercentage = Math.min(percentage, 100);
    const remaining = calculateRemaining(spent, limit.limit);
    const overLimit = calculateOverLimit(spent, limit.limit);
    const overPercent = limit.limit > 0 ? Math.round((overLimit / limit.limit) * 100) : 0;

    // Use different status logic for income vs spend
    const statusVariant = limitType === 'income'
        ? getStatusVariantForIncome(percentage)
        : getStatusVariant(percentage);
    const statusText = limitType === 'income'
        ? getStatusTextForIncome(percentage)
        : getStatusText(percentage);

    const handleDelete = () => {
        if (window.confirm(`Delete limit for "${limit.category}"?`)) {
            onDelete(limit.id);
        }
    };

    return (
        <div className={styles.limitCard}>
            {/* Header with category name and status badge */}
            <div className={styles.cardHeader}>
                <div className={styles.categoryInfo}>
                    <h5 className={styles.categoryName}>{limit.category}</h5>
                    <Badge bg={statusVariant} className={styles.statusBadge}>
                        {percentage}% - {statusText}
                    </Badge>
                </div>
                <div className={styles.cardActions}>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEdit(limit)}
                        title="Edit limit"
                    >
                        <Pencil size={14} />
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDelete}
                        title="Delete limit"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressSection}>
                <GradientProgressBar percentage={progressPercentage} reverse={limitType === 'income'} />
            </div>

            {/* Amount details */}
            <div className={styles.amountDetails}>
                <div className={styles.amountGroup}>
                    <span className={styles.label}>
                        {limitType === 'income' ? 'Actual' : 'Spent'}
                    </span>
                    <span className={styles.amount}>{spent.toFixed(2)}</span>
                </div>
                <div className={styles.amountGroup}>
                    <span className={styles.label}>
                        {limitType === 'income' ? 'Target Income' : 'Limit'}
                    </span>
                    <span className={styles.amount}>{limit.limit.toFixed(2)}</span>
                </div>
                <div className={`${styles.amountGroup} ${limitType === 'income' && percentage > 100 ? styles.incomeBenefit : percentage > 100 ? styles.overLimit : ''}`}>
                    <span className={styles.label}>
                        {limitType === 'income'
                            ? (percentage > 100 ? 'Exceeded' : 'Remaining to Target')
                            : (percentage > 100 ? 'Over' : 'Remaining')
                        }
                    </span>
                    <span className={styles.amount} style={limitType === 'income' && percentage > 100 ? { color: '#10b981', fontWeight: 'bold' } : {}}>
                        {limitType === 'income' && percentage > 100
                            ? `+${overLimit.toFixed(2)} (${overPercent}%)`
                            : (percentage > 100 ? `+${overLimit.toFixed(2)} (${overPercent}%)` : remaining.toFixed(2))
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}

LimitCard.propTypes = {
    limit: PropTypes.shape({
        id: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        limit: PropTypes.number.isRequired,
        type: PropTypes.string,
    }).isRequired,
    spent: PropTypes.number.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    limitType: PropTypes.oneOf(['spend', 'income']),
};

export default LimitCard;
