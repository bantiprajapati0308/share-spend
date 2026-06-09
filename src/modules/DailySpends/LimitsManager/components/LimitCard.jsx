import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { PencilFill, TrashFill, ThreeDotsVertical } from 'react-bootstrap-icons';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import styles from '../styles/LimitsManager.module.scss';
import actionStyles from '../../../../assets/scss/ActionPopover.module.scss';
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
    const [showPopover, setShowPopover] = useState(false);
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
        if (onCategoryClick) onCategoryClick(limit.category);
    }, [onCategoryClick, limit.category]);

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        setShowPopover(false);
        onEdit(limit);
    }, [onEdit, limit]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        setShowPopover(false);
        if (window.confirm(`Delete limit for "${limit.category}"?`)) {
            onDelete(limit.id);
        }
    }, [onDelete, limit]);

    // 6-step colour scale (0 = best, 5 = worst).
    // spend:  high % is bad  → step increases with %
    // income: high % is good → step is reversed
    const COLOR_STEP_CLASSES = [
        styles.progressGreen,
        styles.progressDarkGreen,
        styles.progressYellow,
        styles.progressDarkYellow,
        styles.progressRed,
        styles.progressOverLimit,
    ];
    // Hex values mirror the SCSS classes above
    const COLOR_STEP_HEX = [
        '#22c55e', // green
        '#15803d', // dark green
        '#fbbf24', // yellow
        '#d97706', // dark yellow
        '#ef4444', // red
        '#b91c1c', // dark red (over limit)
    ];

    const getRawStep = (pct) => {
        if (pct > 100) return 5;
        if (pct > 90) return 4;
        if (pct > 75) return 3;
        if (pct > 55) return 2;
        if (pct > 30) return 1;
        return 0;
    };
    const colorStep = limitType === 'income'
        ? 5 - getRawStep(percentage)   // reversed: low income % = worst
        : getRawStep(percentage);

    const progressClass = `${styles.progressFill} ${COLOR_STEP_CLASSES[colorStep]}`;
    const borderColor = COLOR_STEP_HEX[colorStep];

    // Build class strings once
    const percentageClass = `${styles.cardPercentage} ${styles[variant]}`;
    const badgeClass = `${styles.statusBadge} ${variant === 'danger' ? styles.badgeDanger :
        variant === 'warning' ? styles.badgeWarning :
            styles.badgeSuccess
        }`;

    return (
        <div
            className={styles.limitCard}
            onClick={handleCardClick}
            style={{
                border: `1px solid ${borderColor}`,
                borderBottomWidth: '1px',
            }}
        >
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
                <OverlayTrigger
                    placement="left"
                    rootClose
                    show={showPopover}
                    onToggle={(nextShow) => !nextShow && setShowPopover(false)}
                    overlay={
                        <Popover id={`limit-actions-${limit.id}`}>
                            <Popover.Body className="p-1">
                                <button
                                    className={actionStyles.actionPopoverItem}
                                    onClick={handleEdit}
                                >
                                    <PencilFill size={14} className="text-primary" />
                                    Edit Limit
                                </button>
                                <button
                                    className={`${actionStyles.actionPopoverItem} ${actionStyles.actionPopoverItemDanger}`}
                                    onClick={handleDelete}
                                >
                                    <TrashFill size={14} />
                                    Delete Limit
                                </button>
                            </Popover.Body>
                        </Popover>
                    }
                >
                    <button
                        type="button"
                        className={actionStyles.menuBtn}
                        onClick={(e) => { e.stopPropagation(); setShowPopover(prev => !prev); }}
                        title="Options"
                        aria-label="Card options"
                    >
                        <ThreeDotsVertical size={14} />
                    </button>
                </OverlayTrigger>
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
