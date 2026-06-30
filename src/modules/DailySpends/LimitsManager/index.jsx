import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import useLimitsManager from './hooks/useLimitsManager';
import { useSelectedDateRange } from '../hooks/useSelectedDateRange';
import LimitsPanel from './components/LimitsPanel';
import LimitForm from './components/LimitForm';
import CategoryDetailsModal from '../MasterReport/components/CategoryDetailsModal';
import TransactionTypeSelector from '../components/common/TransactionTypeSelector';
import styles from './styles/LimitsManager.module.scss';
import useCategoryContext from '../hooks/useCategoryContext';
import { buildDisabledCategoryLookup, filterTransactionsByDisabledCategories } from '../utils/transactionVisibility';
import { formatLocalDate, parseLocalDate } from '../utils/dateUtils';

const toDateStr = (d) => formatLocalDate(d) || (d ?? '');

function LimitsManager({ embedded = false }) {
    const navigate = useNavigate();
    const { loadDateRange } = useSelectedDateRange();

    // Read transactions already loaded by useDailyExpenses — no extra API call
    const allTransactions = useSelector(state => state.dailySpends.transactions);
    const { categories } = useCategoryContext();

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [activeTab, setActiveTab] = useState('spend');
    const [showLimitForm, setShowLimitForm] = useState(false);
    const [editingLimit, setEditingLimit] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categoryTransactions, setCategoryTransactions] = useState([]);

    const currentLimitType = activeTab;

    const {
        limits,
        categoryTotals,  // derived from Redux via useMemo — no API call
        loading,
        error,
        loadLimits,
        addLimit,
        updateLimit,
        deleteLimit,
    } = useLimitsManager(startDate, endDate, currentLimitType);

    // Single mount effect — load saved date range then load category limits only
    useEffect(() => {
        async function bootstrap() {
            try {
                const savedRange = await loadDateRange();
                let start, end;
                if (savedRange?.startDate && savedRange?.endDate) {
                    start = parseLocalDate(savedRange.startDate);
                    end = parseLocalDate(savedRange.endDate);
                } else {
                    const now = new Date();
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                }
                setStartDate(start);
                setEndDate(end);
                await loadLimits();
            } catch (err) {
                console.error('Error during bootstrap:', err);
                toast.error('Failed to load date range');
            }
        }
        bootstrap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab change is now synchronous — categoryTotals recomputes automatically via useMemo
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Category click uses Redux transactions — no API call
    const handleCategoryClick = useCallback((categoryName) => {
        if (!startDate || !endDate) return;
        const startStr = toDateStr(startDate);
        const endStr = toDateStr(endDate);
        const disabledLookup = buildDisabledCategoryLookup(categories);
        const visibleTransactions = filterTransactionsByDisabledCategories(allTransactions, disabledLookup);
        const filtered = visibleTransactions.filter(tx => {
            if (tx.category !== categoryName) return false;
            if (tx.type !== currentLimitType) return false;
            const txDate = tx.date
                ?? formatLocalDate(tx.createdAt);
            return txDate && txDate >= startStr && txDate <= endStr;
        });
        setCategoryTransactions(filtered);
        setSelectedCategory(categoryName);
        setShowCategoryModal(true);
    }, [allTransactions, currentLimitType, startDate, endDate, categories]);

    const handleAddLimitSubmit = useCallback(async (limitData, limitId) => {
        try {
            setFormSubmitting(true);
            if (limitId) {
                await updateLimit(limitId, limitData);
                setEditingLimit(null);
            } else {
                await addLimit(limitData);
            }
            setShowLimitForm(false);
        } catch (err) {
            console.error('Error saving limit:', err);
        } finally {
            setFormSubmitting(false);
        }
    }, [updateLimit, addLimit]);

    const handleEditLimit = useCallback((limit) => {
        setEditingLimit(limit);
        setShowLimitForm(true);
    }, []);

    const handleDeleteLimit = useCallback(async (limitId) => {
        try {
            await deleteLimit(limitId);
        } catch (err) {
            console.error('Error deleting limit:', err);
        }
    }, [deleteLimit]);

    const handleOpenAddForm = useCallback(() => {
        setEditingLimit(null);
        setShowLimitForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setShowLimitForm(false);
        setEditingLimit(null);
    }, []);

    return (
        <div className={styles.wrapper}>
            {/* Header — hidden when embedded */}
            {!embedded && (
                <div className={styles.header}>
                    <button
                        className={styles.backBtn}
                        onClick={() => navigate('/daily-expenses')}
                        title="Back to Daily Expenses"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className={styles.headerTitle}>Limits Manager</h1>
                    <div style={{ width: 36 }} />
                </div>
            )}

            {/* Tab Toggle */}
            <div className={styles.tabToggleWrap}>
                <TransactionTypeSelector
                    value={activeTab}
                    onChange={handleTabChange}
                    options={[
                        { value: 'spend', label: '💰 Spending Limits' },
                        { value: 'income', label: '🎯 Income Limits' },
                    ]}
                />
            </div>
            {/* Content */}
            <div className={styles.content}>
                {!startDate || !endDate ? (
                    <div className={styles.loadingState}>
                        <span>Loading…</span>
                    </div>
                ) : (
                    <LimitsPanel
                        limits={limits}
                        categoryTotals={categoryTotals}
                        limitType={currentLimitType}
                        onAddLimit={handleOpenAddForm}
                        onEditLimit={handleEditLimit}
                        onDeleteLimit={handleDeleteLimit}
                        onCategoryClick={handleCategoryClick}
                        loading={loading}
                        error={error}
                    />
                )}
            </div>

            {/* Limit Form Modal */}
            <LimitForm
                show={showLimitForm}
                onHide={handleCloseForm}
                onSubmit={handleAddLimitSubmit}
                initialLimit={editingLimit}
                limitType={currentLimitType}
                loading={formSubmitting}
            />

            {/* Category Details Modal */}
            <CategoryDetailsModal
                show={showCategoryModal}
                onHide={() => setShowCategoryModal(false)}
                categoryName={selectedCategory}
                transactions={categoryTransactions}
            />
        </div>
    );
}

export default LimitsManager;
