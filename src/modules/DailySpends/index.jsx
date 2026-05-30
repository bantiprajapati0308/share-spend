import { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
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
import styles from './styles/DailySpends.module.scss';
import { toast } from 'react-toastify';
import FullScreenLoader from '../../components/common/FullScreenLoader';
import { DailySpendTabsList } from '../../Util';
import CategoryManager from './components/CategoryManager';
import LimitsManager from './LimitsManager';
import ReportsTabContent from './components/ReportsTabContent';

function DailySpends() {
    const [activeLandingTab, setActiveLandingTab] = useState('add-transaction');
    const [selectedType, setSelectedType] = useState('spend');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [dateRangeLoaded, setDateRangeLoaded] = useState(false);

    // Edit functionality state
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
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
    const userCategories = useMemo(
        () => allCategories.filter(c => c.isEnabled !== false).map(c => c.name),
        [allCategories]
    );
    const { loadDateRange, saveDateRange } = useSelectedDateRange();

    // Load saved date range from database on mount
    useEffect(() => {
        loadSavedDateRange();
    }, []);

    const loadSavedDateRange = async () => {
        try {
            const savedRange = await loadDateRange();
            if (savedRange && savedRange.startDate && savedRange.endDate) {
                // Convert string dates back to Date objects
                setStartDate(new Date(savedRange.startDate));
                setEndDate(new Date(savedRange.endDate));
            }
            setDateRangeLoaded(true);
        } catch (err) {
            console.error('Error loading saved date range:', err);
            setDateRangeLoaded(true);
        }
    };

    const getDateRangeSummary = () => {
        if (!startDate || !endDate) return 0;
        const rangeStartStr = startDate.toISOString().split('T')[0];
        const rangeEndStr = endDate.toISOString().split('T')[0];

        return transactions
            .filter(tx => {
                const txDateStr = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
                return txDateStr >= rangeStartStr && txDateStr <= rangeEndStr && tx.type === 'spend';
            })
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getDateRangeIncome = () => {
        if (!startDate || !endDate) return 0;
        const rangeStartStr = startDate.toISOString().split('T')[0];
        const rangeEndStr = endDate.toISOString().split('T')[0];

        return transactions
            .filter(tx => {
                const txDateStr = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
                return txDateStr >= rangeStartStr && txDateStr <= rangeEndStr && tx.type === 'income';
            })
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getDateRangePercentage = () => {
        const totalIncome = getDateRangeIncome();
        const totalSpend = getDateRangeSummary();
        return totalIncome > 0 ? (totalSpend / totalIncome) * 100 : 0;
    };

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
        setIsEditMode(true);

        // Scroll to form
        if (addFormRef.current) {
            addFormRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
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



    const tabIconClassById = {
        'add-transaction': styles.tabIconAdd,
        set_limits: styles.tabIconLimits,
        reports: styles.tabIconReports,
        category: styles.tabIconCategory,
    };

    const renderTabContent = () => {
        if (activeLandingTab === 'add-transaction') {
            return (
                <AddExpenseForm
                    onAddExpense={handleAddTransaction}
                    onUpdateExpense={handleUpdateTransaction}
                    editingTransaction={editingTransaction}
                    isEditMode={isEditMode}
                    onCancelEdit={handleCancelEdit}
                    onCategoriesChanged={refreshTransactions}
                />
            );
        }

        if (activeLandingTab === 'set_limits') {
            return <LimitsManager embedded />;
        }

        if (activeLandingTab === 'category') {
            return <CategoryManager onCategoriesChanged={refreshTransactions} />;
        }
        if (activeLandingTab === 'reports') {
            return (
                <ReportsTabContent
                    transactions={transactions}
                    startDate={startDate}
                    endDate={endDate}
                />
            );
        }

        const content = tabContentById[activeLandingTab] || {
            title: 'Coming Soon',
            description: 'Coming Soon'
        };

        return (
            <div className={styles.comingSoonState}>
                <h4>{content.title}</h4>
                <p>{content.description}</p>
            </div>
        );
    };

    const handleLandingTabChange = (tabId) => {
        if (!tabId) return;

        setActiveLandingTab(tabId);

        if (tabId !== 'add-transaction' && isEditMode) {
            handleCancelEdit();
        }
    };


    const displayedTransactions = getTransactionsByType(selectedType)
        .filter(tx => {
            if (!startDate || !endDate) return false;
            const txDateStr = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
            const rangeStartStr = startDate.toISOString().split('T')[0];
            const rangeEndStr = endDate.toISOString().split('T')[0];
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
                        totalSpend={getDateRangeSummary()}
                        totalIncome={getDateRangeIncome()}
                        spendPercentage={getDateRangePercentage()}
                        startDate={startDate}
                        endDate={endDate}
                    />

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
                                        <i
                                            className={`${tab.iconClass} ${styles.tabIcon} ${tabIconClassById[tab.id] || ''}`}
                                            aria-hidden="true"
                                        ></i>
                                        <span className={styles.tabLabel}>{tab.label}</span>
                                    </span>
                                )}
                            >
                                {tab.id === 'add-transaction' && (
                                    <div ref={addFormRef}>
                                        <AddExpenseForm
                                            onAddExpense={handleAddTransaction}
                                            onUpdateExpense={handleUpdateTransaction}
                                            editingTransaction={editingTransaction}
                                            isEditMode={isEditMode}
                                            onCancelEdit={handleCancelEdit}
                                            onCategoriesChanged={refreshTransactions}
                                        />
                                    </div>
                                )}
                                {tab.id === 'set_limits' && <LimitsManager embedded />}
                                {tab.id === 'reports' && (
                                    <ReportsTabContent
                                        transactions={transactions}
                                        startDate={startDate}
                                        endDate={endDate}
                                    />
                                )}
                                {tab.id === 'category' && (
                                    <CategoryManager onCategoriesChanged={refreshTransactions} />
                                )}
                            </Tab>
                        ))}
                    </Tabs>

                    {/* Transaction View Toggle */}
                    <TransactionViewToggle
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                    />

                    {/* Transaction List */}
                    <ExpenseList
                        expenses={displayedTransactions}
                        onDelete={handleDeleteTransaction}
                        onEdit={handleEditTransaction}
                        title={sectionTitle}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export default DailySpends;
