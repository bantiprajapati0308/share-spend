import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftRight, ChevronRight, PieChart, Wallet, XCircleFill } from 'react-bootstrap-icons';
import { formatCurrencyINR } from '../../../Util';
import CategoryDetailsModal from '../reporting/components/CategoryDetailsModal';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import styles from '../styles/AnalyticsTab.module.scss';
import { formatLocalDate } from '../utils/dateUtils';

const LONG_PRESS_MS = 500;

const PALETTE_BG = ['#EEF2FF', '#DCFCE7', '#FEF3C7', '#F3E8FF', '#DBEAFE', '#FCE7F3', '#FEE2E2', '#CCFBF1', '#FFF7ED', '#E0F2FE', '#EDE9FE', '#F0FDF4'];
const PALETTE_COLOR = ['#4F46E5', '#16A34A', '#D97706', '#9333EA', '#2563EB', '#EC4899', '#DC2626', '#0F766E', '#EA580C', '#0369A1', '#7C3AED', '#15803D'];

function formatLastDate(dateStr) {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return null; }
}

function StatCard({ label, value, Icon }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIconBox}><Icon size={20} /></div>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue}>{value}</div>
        </div>
    );
}

function CategoryRow({ category, emoji, totalAmount, count, percentage, lastDate, colorIdx, onClick, onLongPress, isSelected, isSelectionMode }) {
    const timerRef = useRef(null);
    const didLongPress = useRef(false);

    const startPress = () => {
        didLongPress.current = false;
        timerRef.current = setTimeout(() => {
            didLongPress.current = true;
            onLongPress?.();
        }, LONG_PRESS_MS);
    };

    const cancelPress = () => clearTimeout(timerRef.current);

    const bg = PALETTE_BG[colorIdx % PALETTE_BG.length];
    const color = PALETTE_COLOR[colorIdx % PALETTE_COLOR.length];
    const lastDateStr = formatLastDate(lastDate);

    const openModal = (e) => {
        e.stopPropagation();
        if (!isSelectionMode) onClick?.();
    };

    const handleRowClick = () => {
        if (isSelectionMode) onLongPress?.();
    };

    return (
        <div
            className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchMove={cancelPress}
            onClick={handleRowClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); onLongPress?.(); } }}
        >
            <div className={styles.rowIcon} style={{ background: bg }}>
                <span style={{ fontSize: '1.15rem', lineHeight: 1, color }}>{emoji || '📝'}</span>
            </div>
            <div className={styles.rowMeta}>
                <span className={styles.rowName}>{category}</span>
                <span className={styles.rowSub}>{count} Transaction{count !== 1 ? 's' : ''}</span>
                {lastDateStr && <span className={styles.rowDate}>Last: {lastDateStr}</span>}
            </div>
            <div className={styles.rowRight} onClick={isSelectionMode ? undefined : openModal}>
                <span className={styles.rowAmount}>{formatCurrencyINR(totalAmount)}</span>
                <span className={styles.rowPercent}>{percentage.toFixed(1)}%</span>
            </div>
            <ChevronRight size={14} className={styles.rowChevron} onClick={isSelectionMode ? undefined : openModal} />
        </div>
    );
}

CategoryRow.propTypes = {
    category: PropTypes.string.isRequired,
    emoji: PropTypes.string,
    totalAmount: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    percentage: PropTypes.number.isRequired,
    lastDate: PropTypes.string,
    colorIdx: PropTypes.number.isRequired,
    onClick: PropTypes.func,
    onLongPress: PropTypes.func,
    isSelected: PropTypes.bool,
    isSelectionMode: PropTypes.bool,
};

export default function AnalyticsTabContent({ transactions, categories }) {
    const [analyticsType, setAnalyticsType] = useState('spend');
    const [modalCategory, setModalCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState(new Set());

    const handleRowClick = (categoryName) => setModalCategory(categoryName);
    const handleModalClose = () => setModalCategory(null);

    const toggleSelection = useCallback((categoryName) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryName)) next.delete(categoryName);
            else next.add(categoryName);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => setSelectedCategories(new Set()), []);

    // Reset selection when switching type
    useEffect(() => { setSelectedCategories(new Set()); }, [analyticsType]);

    const emojiByName = useMemo(() => {
        const map = {};
        (categories || []).forEach(c => { map[c.name] = c.emoji || ''; });
        return map;
    }, [categories]);

    const filteredTx = useMemo(() =>
        (transactions || []).filter(tx => tx.type === analyticsType),
        [transactions, analyticsType]);

    const modalTransactions = useMemo(() =>
        modalCategory ? filteredTx.filter(tx => (tx.category || 'Others') === modalCategory) : [],
        [modalCategory, filteredTx]);

    const totalAmount = useMemo(() =>
        filteredTx.reduce((s, tx) => s + (parseFloat(tx.amount) || 0), 0),
        [filteredTx]);

    const uniqueCatCount = useMemo(() =>
        new Set(filteredTx.map(tx => tx.category || 'Others')).size,
        [filteredTx]);

    const isSelectionMode = selectedCategories.size > 0;

    const rows = useMemo(() => {
        const byCategory = {};
        filteredTx.forEach(tx => {
            const cat = tx.category || 'Others';
            if (!byCategory[cat]) byCategory[cat] = { amount: 0, count: 0, lastDate: null };
            byCategory[cat].amount += parseFloat(tx.amount) || 0;
            byCategory[cat].count += 1;
            const d = tx.date || formatLocalDate(tx.createdAt);
            if (d && (!byCategory[cat].lastDate || d > byCategory[cat].lastDate)) byCategory[cat].lastDate = d;
        });
        return Object.entries(byCategory)
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(([cat, data]) => ({
                category: cat,
                emoji: emojiByName[cat] || '',
                totalAmount: data.amount,
                count: data.count,
                lastDate: data.lastDate,
                percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
            }));
    }, [filteredTx, emojiByName, totalAmount]);

    const selectedStats = useMemo(() => {
        if (selectedCategories.size === 0) return null;
        return rows.reduce(
            (acc, row) => selectedCategories.has(row.category)
                ? { amount: acc.amount + row.totalAmount, txCount: acc.txCount + row.count }
                : acc,
            { amount: 0, txCount: 0 }
        );
    }, [rows, selectedCategories]);

    const displayAmount = isSelectionMode ? selectedStats.amount : totalAmount;
    const displayTxCount = isSelectionMode ? selectedStats.txCount : filteredTx.length;
    const displayCatCount = isSelectionMode ? selectedCategories.size : uniqueCatCount;

    return (
        <div className={styles.wrapper}>

            {/* Type toggle */}
            <TransactionTypeSelector
                value={analyticsType}
                onChange={setAnalyticsType}
                options={[
                    { value: 'spend', label: '💰 Spending' },
                    { value: 'income', label: '📈 Income' },
                ]}
                showLabel={false}
            />

            {/* 3-column stats row */}
            <div className={`${styles.statsGrid} ${isSelectionMode ? styles.statsGridActive : ''}`}>
                <StatCard label={analyticsType === 'spend' ? 'Total Expenses' : 'Total Income'} value={formatCurrencyINR(displayAmount, { decimals: 0 })} Icon={Wallet} />
                <StatCard label="Transactions" value={displayTxCount} Icon={ArrowLeftRight} />
                <StatCard label="Categories" value={displayCatCount} Icon={PieChart} />
            </div>

            {/* Selection mode banner */}
            {isSelectionMode && (
                <div className={styles.selectionBanner}>
                    <span className={styles.selectionText}>
                        {selectedCategories.size} {selectedCategories.size === 1 ? 'category' : 'categories'} selected
                    </span>
                    <button type="button" className={styles.clearSelBtn} onClick={clearSelection} aria-label="Clear selection">
                        <XCircleFill size={12} />
                        Clear
                    </button>
                </div>
            )}

            {/* Category list */}
            {rows.length === 0 ? (
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>ðŸ“Š</div>
                        <p className={styles.emptyText}>No {analyticsType === 'spend' ? 'expense' : 'income'} data in this period</p>
                    </div>
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.categoryList}>
                        {rows.map((row, i) => (
                            <CategoryRow
                                key={row.category}
                                category={row.category}
                                emoji={row.emoji}
                                totalAmount={row.totalAmount}
                                count={row.count}
                                lastDate={row.lastDate}
                                percentage={row.percentage}
                                colorIdx={i}
                                isSelected={selectedCategories.has(row.category)}
                                isSelectionMode={isSelectionMode}
                                onClick={() => handleRowClick(row.category)}
                                onLongPress={() => toggleSelection(row.category)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <CategoryDetailsModal
                show={!!modalCategory}
                onHide={handleModalClose}
                categoryName={modalCategory || ''}
                transactions={modalTransactions}
            />

        </div>
    );
}

AnalyticsTabContent.propTypes = {
    transactions: PropTypes.array.isRequired,
    categories: PropTypes.array,
};
