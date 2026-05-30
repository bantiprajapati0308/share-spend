import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'react-bootstrap-icons';
import { Spinner, Alert } from 'react-bootstrap';
import styles from '../styles/LimitsManager.module.scss';
import LimitCard from './LimitCard';
import EmptyState from './EmptyState';
import {
    getLimitsSummary,
    sortLimitsByUrgency,
    calculateLimitPercentage,
} from '../utils/limitsCalculations';
import { formatCurrencyINR } from '../../../../Util';
import useCategoryContext from '../../hooks/useCategoryContext';

const FILTER_OPTIONS = [
    { key: 'all', label: 'All', chipClass: null },
    { key: 'overLimit', label: 'Over Limit', chipClass: styles.chipOverLimit },
    { key: 'caution', label: 'Caution', chipClass: styles.chipCaution },
    { key: 'onTrack', label: 'On Track', chipClass: styles.chipOnTrack },
];

/**
 * LimitsPanel — mobile-first panel for spend or income limits.
 */
function LimitsPanel({
    limits,
    categoryTotals,
    limitType = 'spend',
    onAddLimit,
    onEditLimit,
    onDeleteLimit,
    onCategoryClick,
    loading = false,
    error = null,
}) {
    const [activeFilter, setActiveFilter] = useState('all');
    const { categories } = useCategoryContext();

    const typeLabel = limitType === 'income' ? 'Income' : 'Spending';

    // Build a name→emoji lookup from category context
    const categoryEmojiMap = useMemo(
        () => categories.reduce((map, cat) => { map[cat.name] = cat.emoji; return map; }, {}),
        [categories]
    );

    // Filter limits by type and sort by urgency
    const typedLimits = useMemo(() => {
        const filtered = limits.filter(l => (l.type || 'spend') === limitType);
        return sortLimitsByUrgency(filtered, categoryTotals);
    }, [limits, limitType, categoryTotals]);

    // Summary stats for the 4-box header grid
    const summary = useMemo(
        () => getLimitsSummary(typedLimits, categoryTotals),
        [typedLimits, categoryTotals]
    );

    // Per-filter bucket counts
    const filterCounts = useMemo(() => {
        let overLimit = 0;
        let caution = 0;
        let onTrack = 0;
        typedLimits.forEach(l => {
            const pct = calculateLimitPercentage(categoryTotals[l.category] || 0, l.limit);
            if (pct > 100) overLimit += 1;
            else if (pct > 80) caution += 1;
            else onTrack += 1;
        });
        return { all: typedLimits.length, overLimit, caution, onTrack };
    }, [typedLimits, categoryTotals]);

    // Apply active filter
    const filteredLimits = useMemo(() => {
        if (activeFilter === 'all') return typedLimits;
        return typedLimits.filter(l => {
            const pct = calculateLimitPercentage(categoryTotals[l.category] || 0, l.limit);
            if (activeFilter === 'overLimit') return pct > 100;
            if (activeFilter === 'caution') return pct > 80 && pct <= 100;
            if (activeFilter === 'onTrack') return pct <= 80;
            return true;
        });
    }, [typedLimits, activeFilter, categoryTotals]);

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <Spinner animation="border" size="sm" />
                <span>Loading {typeLabel.toLowerCase()} limits…</span>
            </div>
        );
    }

    const avgClass =
        summary.averageUsage > 100
            ? styles.danger
            : summary.averageUsage > 80
                ? styles.warning
                : styles.primary;

    return (
        <>
            {error && <Alert variant="warning" className="mb-3">{error}</Alert>}

            {/* 4-stat summary grid */}
            {typedLimits.length > 0 && (
                <div className={styles.summaryGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Budget</span>
                        <span className={styles.statValue}>{formatCurrencyINR(summary.totalBudget)}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Spent</span>
                        <span className={styles.statValue}>{formatCurrencyINR(summary.totalSpent)}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Average Usage</span>
                        <span className={`${styles.statValue} ${avgClass}`}>{summary.averageUsage}%</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Over Limit</span>
                        <span className={`${styles.statValue} ${filterCounts.overLimit > 0 ? styles.danger : ''}`}>
                            {filterCounts.overLimit}
                        </span>
                    </div>
                </div>
            )}

            {/* Full-width add button */}
            <button type="button" className={styles.addBtn} onClick={onAddLimit}>
                <Plus size={20} /> Add {typeLabel} Limit
            </button>

            {/* Filter chips — only when there are limits */}
            {typedLimits.length > 0 && (
                <div className={styles.filterRow}>
                    {FILTER_OPTIONS.map(({ key, label, chipClass }) => (
                        <button
                            key={key}
                            type="button"
                            className={[
                                styles.filterChip,
                                chipClass || '',
                                activeFilter === key ? styles.chipActive : '',
                            ].join(' ').trim()}
                            onClick={() => setActiveFilter(key)}
                        >
                            {label} ({filterCounts[key]})
                        </button>
                    ))}
                </div>
            )}

            {/* Limits list */}
            {filteredLimits.length === 0 ? (
                <EmptyState limitType={limitType} onAddClick={onAddLimit} />
            ) : (
                <div className={styles.limitsList}>
                    {filteredLimits.map(limit => (
                        <LimitCard
                            key={limit.id}
                            limit={limit}
                            spent={categoryTotals[limit.category] || 0}
                            onEdit={onEditLimit}
                            onDelete={onDeleteLimit}
                            onCategoryClick={onCategoryClick}
                            limitType={limitType}
                            emoji={categoryEmojiMap[limit.category] || '📝'}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

LimitsPanel.propTypes = {
    limits: PropTypes.array.isRequired,
    categoryTotals: PropTypes.object.isRequired,
    limitType: PropTypes.oneOf(['spend', 'income']).isRequired,
    onAddLimit: PropTypes.func.isRequired,
    onEditLimit: PropTypes.func.isRequired,
    onDeleteLimit: PropTypes.func.isRequired,
    onCategoryClick: PropTypes.func,
    loading: PropTypes.bool,
    error: PropTypes.string,
};

export default LimitsPanel;
