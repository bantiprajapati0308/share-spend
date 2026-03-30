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
    formatCurrency,
} from '../utils/limitsCalculations';
import GradientProgressBar from '../../components/GradientProgressBar';

/**
 * LimitCard Component
 * Displays a single limit with progress and actions
 */
function LimitCard({ limit, spent, onEdit, onDelete }) {
    const percentage = calculateLimitPercentage(spent, limit.limit);
    const remaining = calculateRemaining(spent, limit.limit);
    const overLimit = calculateOverLimit(spent, limit.limit);
    const statusVariant = getStatusVariant(percentage);
    const statusText = getStatusText(percentage);

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
                <GradientProgressBar percentage={percentage} />
            </div>

            {/* Amount details */}
            <div className={styles.amountDetails}>
                <div className={styles.amountGroup}>
                    <span className={styles.label}>Spent</span>
                    <span className={styles.amount}>{formatCurrency(spent)}</span>
                </div>
                <div className={styles.amountGroup}>
                    <span className={styles.label}>Limit</span>
                    <span className={styles.amount}>{formatCurrency(limit.limit)}</span>
                </div>
                <div className={`${styles.amountGroup} ${percentage > 100 ? styles.overLimit : ''}`}>
                    <span className={styles.label}>
                        {percentage > 100 ? 'Over' : 'Remaining'}
                    </span>
                    <span className={styles.amount}>
                        {formatCurrency(percentage > 100 ? overLimit : remaining)}
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
};

export default LimitCard;
