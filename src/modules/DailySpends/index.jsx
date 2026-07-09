import { lazy, Suspense, useCallback, useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useDailyExpenses } from './hooks/useDailyExpenses';
import useCategoryContext from './hooks/useCategoryContext';
import { useSelectedDateRange } from './hooks/useSelectedDateRange';
import DailySpendsHeader from './components/DailySpendsHeader';
import DateRangeAccordion from './components/DateRangeAccordion';
import DualSummaryCards from './components/DualSummaryCards';
import AddExpenseForm from './components/AddExpenseForm';
import TransactionViewToggle from './components/TransactionViewToggle';
import ExpenseList from './components/ExpenseList';
import DateRangePicker from './components/DateRangePicker';
import TimeSummarySection from './components/TimeSummarySection';
import styles from './styles/DailySpends.module.scss';
import { toast } from 'react-toastify';
import FullScreenLoader from '../../components/common/FullScreenLoader';
import FloatingActionButton from '../../components/common/FloatingActionButton';
import { DailySpendTabsList } from '../../Util';
import { formatLocalDate, getTransactionDateKey, parseLocalDate } from './utils/dateUtils';

const AnalyticsTabContent = lazy(() => import('./components/AnalyticsTabContent'));
const CategoryManager = lazy(() => import('./components/CategoryManager'));
const LimitsManager = lazy(() => import('./LimitsManager'));
const ReportsTabContent = lazy(() => import('./components/ReportsTabContent'));

function TabLoader() {
    return (
        <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" />
        </div>
    );
}

function DailySpends() {
    const [activeLandingTab, setActiveLandingTab] = useState('add-transaction');
    const [selectedType, setSelectedType] = useState('spend');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [dateRangeLoaded, setDateRangeLoaded] = useState(false);

    // Edit functionality state
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formResetKey, setFormResetKey] = useState(0);
    const addFormRef = useRef(null);

    const {
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        getTransactionsByType,
        refreshTransactions,
        loading,
        error,
    } = useDailyExpenses(startDate, endDate);

    const { categories: allCategories } = useCategoryContext();
    const { loadDateRange, saveDateRange } = useSelectedDateRange();

    const loadSavedDateRange = useCallback(async () => {
        try {
            const savedRange = await loadDateRange();
            if (savedRange && savedRange.startDate && savedRange.endDate) {
                // Convert string dates back to Date objects
                setStartDate(parseLocalDate(savedRange.startDate));
                setEndDate(parseLocalDate(savedRange.endDate));
            }
            setDateRangeLoaded(true);
        } catch (err) {
            console.error('Error loading saved date range:', err);
            setDateRangeLoaded(true);
        }
    }, [loadDateRange]);

    // Load saved date range from database on mount
    useEffect(() => {
        loadSavedDateRange();
    }, [loadSavedDateRange]);

    const handleDateRangeChange = async (newRange) => {
        try {
            // Save to database
            await saveDateRange(newRange.startDate, newRange.endDate);
            // Update local state
            setStartDate(newRange.startDate);
            setEndDate(newRange.endDate);
            toast.success('Date range saved successfully!');
        } catch (err) {
            console.error('Error saving date range:', err);
            toast.error('Failed to save date range');
            throw err;
        }
    };

    const handleAddTransaction = async (newTransaction) => {
        try {
            await addTransaction(newTransaction);
        } catch (err) {
            toast.error(err.message || 'Failed to add transaction');
            throw err;
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await deleteTransaction(id);
            toast.info('Transaction deleted');
        } catch (err) {
            toast.error(err.message || 'Failed to delete transaction');
        }
    };

    const handleEditTransaction = async (transaction) => {
        // Set edit mode and populate form
        setEditingTransaction(transaction);
        setActiveLandingTab('add-transaction');
        setIsEditMode(true);

        // Scroll to form
        if (addFormRef.current) {
            addFormRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const handleUpdateTransaction = async (updatedTransaction) => {
        try {
            await updateTransaction(editingTransaction.id, updatedTransaction);
            // Clear edit mode
            setEditingTransaction(null);
            setIsEditMode(false);
        } catch (err) {
            toast.error(err.message || 'Failed to update transaction');
            throw err;
        }
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
        setIsEditMode(false);
    };

    const handleFAB = () => {
        // 1. Reset form by bumping key (clears all fields)
        setFormResetKey(k => k + 1);
        // 2. Cancel any active edit
        if (isEditMode) {
            setEditingTransaction(null);
            setIsEditMode(false);
        }
        // 3. Switch to add-transaction tab
        setActiveLandingTab('add-transaction');
        // 4. Smooth-scroll to the form section
        requestAnimationFrame(() => {
            addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };



    const tabIconClassById = {
        'add-transaction': styles.tabIconAdd,
        set_limits: styles.tabIconLimits,
        reports: styles.tabIconReports,
        category: styles.tabIconCategory,
    };

    const handleLandingTabChange = (tabId) => {
        if (!tabId) return;

        if (tabId !== 'add-transaction') {
            setFormResetKey(k => k + 1);
            if (isEditMode) handleCancelEdit();
        }

        setActiveLandingTab(tabId);
    };


    const displayedTransactions = getTransactionsByType(selectedType)
        .filter(tx => {
            if (!startDate || !endDate) return false;
            const txDateStr = getTransactionDateKey(tx);
            const rangeStartStr = formatLocalDate(startDate);
            const rangeEndStr = formatLocalDate(endDate);
            return txDateStr >= rangeStartStr && txDateStr <= rangeEndStr;
        });
    const sectionTitle = selectedType === 'spend' ? "Expenses" : "Income";
    // Show loader while loading date range
    if (!dateRangeLoaded || loading) {
        return <FullScreenLoader />;
    }

    // Show date range selection screen if no date range is set
    if (!startDate || !endDate) {
        return (
            <Container className={styles.container}>
                <Row>
                    <Col lg={8} className="mx-auto">
                        <DailySpendsHeader />
                        <div className={styles.dateRangePromptCard}>
                            <h3 className={styles.dateRangePromptTitle}>📅 Select Date Range</h3>
                            <p className={styles.dateRangePromptText}>
                                Please select a date range to start tracking your expenses and income.
                            </p>
                            <div className={styles.dateRangePickerWrapper}>
                                <DateRangePicker
                                    onDateRangeChange={handleDateRangeChange}
                                    defaultStartDate={null}
                                    defaultEndDate={null}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className={styles.container}>
                <Row>
                    <Col lg={8} className="mx-auto">
                        <DailySpendsHeader />
                        <Alert variant="danger" className={styles.errorAlert}>
                            <strong>Error:</strong> Failed to load transactions: {error}
                        </Alert>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className={styles.container}>
            <Row>
                <Col lg={8} className="mx-auto">
                    {/* Header */}
                    <DailySpendsHeader />

                    {/* Report Action Buttons */}

                    {/* Date Range Accordion */}
                    {startDate && endDate && (
                        <DateRangeAccordion
                            startDate={startDate}
                            endDate={endDate}
                            onDateRangeChange={handleDateRangeChange}
                        />
                    )}

                    {/* Date Range Summary Cards */}
                    <DualSummaryCards
                        startDate={startDate}
                        endDate={endDate}
                    />
                    <div ref={addFormRef}>
                        <Tabs
                            id="daily-spends-tabs"
                            activeKey={activeLandingTab}
                            onSelect={handleLandingTabChange}
                            className={`${styles.dailyTabs} mb-2`}
                            mountOnEnter
                            unmountOnExit={false}
                        >
                            {DailySpendTabsList.map(tab => (
                                <Tab
                                    key={tab.id}
                                    eventKey={tab.id}
                                    title={(
                                        <span className={styles.tabTitle}>
                                            <tab.Icon
                                                size={14}
                                                className={`${styles.tabIcon} ${tabIconClassById[tab.id] || ''}`}
                                                aria-hidden="true"
                                            />
                                            <span className={styles.tabLabel}>{tab.label}</span>
                                        </span>
                                    )}
                                >
                                    {tab.id === 'add-transaction' && (
                                        <div>
                                            <AddExpenseForm
                                                onAddExpense={handleAddTransaction}
                                                onUpdateExpense={handleUpdateTransaction}
                                                editingTransaction={editingTransaction}
                                                isEditMode={isEditMode}
                                                onCancelEdit={handleCancelEdit}
                                                onCategoriesChanged={refreshTransactions}
                                                onGoToCategories={() => handleLandingTabChange('category')}
                                                key={formResetKey}
                                            />
                                        </div>
                                    )}
                                    {tab.id === 'set_limits' && (
                                        <Suspense fallback={<TabLoader />}>
                                            <LimitsManager embedded />
                                        </Suspense>
                                    )}
                                    {tab.id === 'analytics' && (
                                        <Suspense fallback={<TabLoader />}>
                                            <AnalyticsTabContent
                                                transactions={transactions}
                                                categories={allCategories}
                                            />
                                        </Suspense>
                                    )}
                                    {tab.id === 'reports' && (
                                        <Suspense fallback={<TabLoader />}>
                                            <ReportsTabContent
                                                transactions={transactions}
                                                startDate={startDate}
                                                endDate={endDate}
                                            />
                                        </Suspense>
                                    )}
                                    {tab.id === 'category' && (
                                        <Suspense fallback={<TabLoader />}>
                                            <CategoryManager onCategoriesChanged={refreshTransactions} />
                                        </Suspense>
                                    )}
                                </Tab>
                            ))}
                        </Tabs>
                    </div>
                    {/* Transaction View Toggle */}
                    <TransactionViewToggle
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                    />

                    {/* Spending / Income Overview — Today & Last 7 Days */}
                    <TimeSummarySection transactions={transactions} selectedType={selectedType} />

                    {/* Transaction List */}
                    <ExpenseList
                        expenses={displayedTransactions}
                        onDelete={handleDeleteTransaction}
                        onEdit={handleEditTransaction}
                        title={sectionTitle}
                    />
                </Col>
            </Row>

            <FloatingActionButton onClick={handleFAB} ariaLabel="Add new transaction" fixed />
        </Container>
    );
}

export default DailySpends;
