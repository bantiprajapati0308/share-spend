import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useDailyExpenses } from './hooks/useDailyExpenses';
import { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit } from '../../hooks/useCategoryLimits';
import { getCategoryTotals, getBreakdownData } from '../../hooks/useCategoryBreakdown';
import DualSummaryCards from './components/DualSummaryCards';
import AddExpenseForm from './components/AddExpenseForm';
import ExpenseList from './components/ExpenseList';
import DateRangePicker from './components/DateRangePicker';
import CategoryLimitsManagement from './components/CategoryLimitsManagement';
import styles from './styles/DailySpends.module.scss';
import { toast } from 'react-toastify';
import FullScreenLoader from '../../components/common/FullScreenLoader';

function DailySpends() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedType, setSelectedType] = useState('spend');
    const [startDate, setStartDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
    const [endDate, setEndDate] = useState(new Date(new Date().setHours(23, 59, 59, 999)));
    const [categoryLimits, setCategoryLimits] = useState([]);
    const [categoryTotals, setCategoryTotals] = useState({});
    const [limitsLoading, setLimitsLoading] = useState(false);
    const [limitsError, setLimitsError] = useState(null);

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

    // Load category limits on mount
    useEffect(() => {
        loadCategoryLimits();
    }, []);

    // Update category totals when date range changes
    useEffect(() => {
        loadCategoryTotals();
    }, [startDate, endDate]);

    const loadCategoryLimits = async () => {
        try {
            setLimitsLoading(true);
            const limits = await getCategoryLimits();
            setCategoryLimits(limits);
            setLimitsError(null);
        } catch (err) {
            console.error('Error loading category limits:', err);
            setLimitsError(err.message);
        } finally {
            setLimitsLoading(false);
        }
    };

    const loadCategoryTotals = async () => {
        try {
            // Convert dates to string format for Firebase
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const totals = await getCategoryTotals(startDateStr, endDateStr);
            setCategoryTotals(totals);
        } catch (err) {
            console.error('Error loading category totals:', err);
        }
    };

    const getDateRangeSummary = () => {
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

    const handleDateRangeChange = (newRange) => {
        setStartDate(newRange.startDate);
        setEndDate(newRange.endDate);
        loadCategoryTotals();
    };

    const handleAddLimit = async (limitData) => {
        try {
            const limit = await addCategoryLimit(limitData);
            setCategoryLimits([...categoryLimits, limit]);
            toast.success(`Limit set for ${limitData.category}`);
        } catch (err) {
            toast.error(err.message || 'Failed to add limit');
        }
    };

    const handleUpdateLimit = async (limitId, limitData) => {
        try {
            await updateCategoryLimit(limitId, limitData);
            const updated = categoryLimits.map(l => l.id === limitId ? { id: limitId, ...limitData } : l);
            setCategoryLimits(updated);
            toast.success(`Limit updated for ${limitData.category}`);
        } catch (err) {
            toast.error(err.message || 'Failed to update limit');
        }
    };

    const handleDeleteLimit = async (limitId) => {
        try {
            await deleteCategoryLimit(limitId);
            setCategoryLimits(categoryLimits.filter(l => l.id !== limitId));
            toast.success('Limit deleted');
        } catch (err) {
            toast.error(err.message || 'Failed to delete limit');
        }
    };

    const handleAddTransaction = async (newTransaction) => {
        try {
            await addTransaction(newTransaction);
            await loadCategoryTotals();
        } catch (err) {
            toast.error(err.message || 'Failed to add transaction');
            throw err;
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await deleteTransaction(id);
            toast.info('Transaction deleted');
            await loadCategoryTotals();
        } catch (err) {
            toast.error(err.message || 'Failed to delete transaction');
        }
    };

    const handleOpenBreakdownReport = () => {
        navigate('/share-spend/breakdown-report', {
            state: {
                startDate,
                endDate,
                categoryLimits,
            }
        });
    };

    const handleOpenMasterReport = () => {
        navigate('/share-spend/master-report');
    };

    const displayedTransactions = getTransactionsByType(selectedType)
        .filter(tx => {
            const txDateStr = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
            const rangeStartStr = startDate.toISOString().split('T')[0];
            const rangeEndStr = endDate.toISOString().split('T')[0];
            return txDateStr >= rangeStartStr && txDateStr <= rangeEndStr;
        });
    const sectionTitle = selectedType === 'spend' ? "Expenses" : "Income";

    if (loading) {
        return <FullScreenLoader />;
    }

    if (error) {
        return (
            <Container className={styles.container}>
                <Row>
                    <Col lg={8} className="mx-auto">
                        <Alert variant="danger">Failed to load transactions: {error}</Alert>
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
                    <div className={styles.header}>
                        <h1>Daily Spends</h1>
                        <p>Track your daily spending and manage your budget</p>
                    </div>

                    {/* Report Action Buttons */}
                    <div className={styles.reportActionsTop}>
                        <Button
                            variant="primary"
                            onClick={handleOpenBreakdownReport}
                            className={styles.reportBtn}
                        >
                            View Breakdown Report
                        </Button>
                        <Button
                            variant="outline-primary"
                            onClick={handleOpenMasterReport}
                            className={styles.reportBtn}
                        >
                            View Master Report
                        </Button>
                    </div>

                    {/* Date Range Picker */}
                    <DateRangePicker
                        onDateRangeChange={handleDateRangeChange}
                        defaultStartDate={startDate}
                        defaultEndDate={endDate}
                    />

                    {/* Date Range Summary Cards */}
                    <DualSummaryCards
                        totalSpend={getDateRangeSummary()}
                        totalIncome={getDateRangeIncome()}
                        spendPercentage={getDateRangePercentage()}
                        startDate={startDate}
                        endDate={endDate}
                    />

                    {/* Category Limits Management */}
                    {limitsLoading ? (
                        <div className={styles.loadingSpinner}>
                            <Spinner animation="border" size="sm" />
                            <span>Loading limits...</span>
                        </div>
                    ) : (
                        <CategoryLimitsManagement
                            categories={['🍔 Food', '🚗 Transport', '🏥 Health', '🎮 Entertainment', '📚 Education', '🛍️ Shopping', 'Other']}
                            limits={categoryLimits}
                            categoryTotals={categoryTotals}
                            startDate={startDate}
                            endDate={endDate}
                            onAddLimit={handleAddLimit}
                            onUpdateLimit={handleUpdateLimit}
                            onDeleteLimit={handleDeleteLimit}
                            loading={limitsLoading}
                            error={limitsError}
                        />
                    )}

                    {/* Add Transaction Form */}
                    <AddExpenseForm onAddExpense={handleAddTransaction} />

                    {/* View Toggle */}
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${selectedType === 'spend' ? styles.active : ''}`}
                            onClick={() => setSelectedType('spend')}
                        >
                            Expenses
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${selectedType === 'income' ? styles.active : ''}`}
                            onClick={() => setSelectedType('income')}
                        >
                            Income
                        </button>
                    </div>

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
