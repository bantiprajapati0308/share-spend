import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { useDailyExpenses } from './hooks/useDailyExpenses';
import { useUserCategories } from './hooks/useUserCategories';
import { useSelectedDateRange } from './hooks/useSelectedDateRange';
import { getCategoryTotals, getBreakdownData } from '../../hooks/useCategoryBreakdown';
import DailySpendsHeader from './components/DailySpendsHeader';
import ReportActionButtons from './components/ReportActionButtons';
import DateRangeAccordion from './components/DateRangeAccordion';
import DualSummaryCards from './components/DualSummaryCards';
import AddExpenseForm from './components/AddExpenseForm';
import TransactionViewToggle from './components/TransactionViewToggle';
import ExpenseList from './components/ExpenseList';
import DateRangePicker from './components/DateRangePicker';
import styles from './styles/DailySpends.module.scss';
import { toast } from 'react-toastify';
import FullScreenLoader from '../../components/common/FullScreenLoader';

function DailySpends() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedType, setSelectedType] = useState('spend');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [dateRangeLoaded, setDateRangeLoaded] = useState(false);
    const [userCategories, setUserCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const {
        transactions,
        addTransaction,
        deleteTransaction,
        getTotalSpend,
        getTotalIncome,
        getSpendPercentage,
        getTransactionsByType,
        loading,
        error,
    } = useDailyExpenses();

    const { fetchEnabledCategories } = useUserCategories();
    const { loadDateRange, saveDateRange } = useSelectedDateRange();

    // Load saved date range from database on mount
    useEffect(() => {
        loadSavedDateRange();
    }, []);

    // Load user categories on mount
    useEffect(() => {
        loadUserCategories();
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

    const loadUserCategories = async () => {
        try {
            setCategoriesLoading(true);
            const categories = await fetchEnabledCategories();
            // Extract category names for the limits dropdown
            const categoryNames = categories.map(cat => cat.name);
            setUserCategories(categoryNames);
        } catch (err) {
            console.error('Error loading user categories:', err);
            // Fallback to empty array - users won't see categories until they create one
            setUserCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const loadCategoryTotals = async () => {
        try {
            if (!startDate || !endDate) return;
            // Convert dates to string format for Firebase
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const totals = await getCategoryTotals(startDateStr, endDateStr);
        } catch (err) {
            console.error('Error loading category totals:', err);
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
        return totalIncome > 0 ? Math.round((totalSpend / totalIncome) * 100) : 0;
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

    const handleOpenBreakdownReport = () => {
        navigate('/share-spend/breakdown-report', {
            state: {
                startDate,
                endDate,
            }
        });
    };

    const handleOpenMasterReport = () => {
        navigate('/share-spend/master-report');
    };

    const handleOpenLimitsManager = () => {
        navigate('/share-spend/limits-manager', {
            state: { from: '/share-spend/daily-expenses' }
        });
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
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #dc3545',
                            borderRadius: '8px',
                            padding: '40px 20px',
                            textAlign: 'center',
                            marginTop: '30px'
                        }}>
                            <h3 style={{ color: '#dc3545', marginBottom: '20px' }}>📅 Select Date Range</h3>
                            <p style={{ fontSize: '16px', marginBottom: '30px', color: '#666' }}>
                                Please select a date range to start tracking your expenses and income.
                            </p>
                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
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
                        <Alert variant="danger" style={{ marginTop: '20px' }}>
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

                    {/* Add Transaction Form */}
                    <AddExpenseForm onAddExpense={handleAddTransaction} />
                    <ReportActionButtons
                        onBreakdownClick={handleOpenBreakdownReport}
                        onMasterClick={handleOpenMasterReport}
                        onLimitsClick={handleOpenLimitsManager}
                    />
                    {/* Transaction View Toggle */}
                    <TransactionViewToggle
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                    />

                    {/* Transaction List */}
                    <ExpenseList
                        expenses={displayedTransactions}
                        onDelete={handleDeleteTransaction}
                        title={sectionTitle}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export default DailySpends;
