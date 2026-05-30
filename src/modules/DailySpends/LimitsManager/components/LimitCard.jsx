import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { PencilFill, TrashFill } from 'react-bootstrap-icons';
import styles from '../styles/LimitsManager.module.scss';
import {
    calculateLimitPercentage,
    getStatusText,
    getStatusTextForIncome,
} from '../utils/limitsCalculations';
import { formatCurrencyINR } from '../../../../Util';
import { formatPercentage } from '../../../../utils/helper';

// Pastel bg colours — deterministic per category name
const ICON_COLORS = [
    '#fde8f0', '#fef3e2', '#e8f5e9', '#e3f2fd',
    '#f3e8ff', '#e8f4f8', '#fff3e0', '#fce4ec',
    '#e0f2f1', '#f9fbe7', '#ede7f6', '#e1f5fe',
];

const getIconBg = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
};

/**
 * LimitCard — compact mobile-first card row.
 * Shows icon · name · spent/limit · percentage · status badge · progress bar.
 * Tapping the card opens category transactions; ⋮ reveals edit / delete.
 */
function LimitCard({ limit, spent, onEdit, onDelete, limitType = 'spend', onCategoryClick, emoji = '📝' }) {
    const [showActions, setShowActions] = useState(false);

    const percentage = useMemo(
        () => formatPercentage(calculateLimitPercentage(spent, limit.limit)),
        [spent, limit.limit]
    );
    const progressPct = Math.min(percentage, 100);

    const statusText = limitType === 'income'
        ? getStatusTextForIncome(percentage)
        : getStatusText(percentage);

    const isOverLimit = percentage > 100;
    const isCaution = !isOverLimit && percentage > 80;
    // 'danger' | 'warning' | 'success'
    const variant = isOverLimit ? 'danger' : isCaution ? 'warning' : 'success';

    const iconBg = useMemo(() => getIconBg(limit.category), [limit.category]);

    const handleCardClick = useCallback(() => {
        if (!showActions && onCategoryClick) onCategoryClick(limit.category);
    }, [showActions, onCategoryClick, limit.category]);

    const handleActionsToggle = useCallback((e) => {
        e.stopPropagation();
        setShowActions(prev => !prev);
    }, []);

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        setShowActions(false);
        onEdit(limit);
    }, [onEdit, limit]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        setShowActions(false);
        if (window.confirm(`Delete limit for "${limit.category}"?`)) {
            onDelete(limit.id);
        }
    }, [onDelete, limit]);

    // Build class strings once
    const percentageClass = `${styles.cardPercentage} ${styles[variant]}`;
    const badgeClass = `${styles.statusBadge} ${variant === 'danger' ? styles.badgeDanger :
            variant === 'warning' ? styles.badgeWarning :
                styles.badgeSuccess
        }`;
    const progressClass = `${styles.progressFill} ${variant === 'danger' ? styles.progressDanger :
            variant === 'warning' ? styles.progressWarning :
                styles.progressSuccess
        }`;

    return (
        <div className={styles.limitCard} onClick={handleCardClick}>
            {/* Inline action bar (edit / delete) */}
            {showActions && (
                <div className={styles.cardActionsBar}>
                    <button type="button" className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={handleEdit}>
                        <PencilFill size={11} /> Edit
                    </button>
                    <button type="button" className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={handleDelete}>
                        <TrashFill size={11} /> Delete
                    </button>
                </div>
            )}

            {/* Main row */}
            <div className={styles.cardRow}>
                {/* Category icon */}
                <div className={styles.categoryIcon} style={{ background: iconBg }}>
                    {emoji}
                </div>

                {/* Name + spent/limit */}
                <div className={styles.cardInfo}>
                    <p className={styles.cardName}>{limit.category}</p>
                    <p className={styles.cardAmount}>
                        {formatCurrencyINR(spent)} / {formatCurrencyINR(limit.limit)}
                    </p>
                </div>

                {/* Percentage + status badge */}
                <div className={styles.cardRight}>
                    <span className={percentageClass}>{percentage}%</span>
                    <span className={badgeClass}>{statusText}</span>
                </div>

                {/* Options toggle */}
                <button
                    type="button"
                    className={styles.actionsToggle}
                    onClick={handleActionsToggle}
                    title="Options"
                    aria-label="Card options"
                >
                    ⋮
                </button>
            </div>

            {/* Progress bar */}
            <div className={styles.progressTrack}>
                <div className={progressClass} style={{ width: `${progressPct}%` }} />
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
    onCategoryClick: PropTypes.func,
    emoji: PropTypes.string,
};

export default LimitCard;
