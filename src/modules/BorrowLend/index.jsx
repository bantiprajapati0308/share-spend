import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLendingTransactions } from './hooks/useLendingTransactions';
import TopSection from './components/TopSection';
import AddTransactionForm from './components/AddTransactionForm';
import DueTrackingSection from './components/DueTracking';
import TransactionList from './components/TransactionList';
import BorrowLendTable from './components/BorrowLendTable';
import FullScreenLoader from '../../components/common/FullScreenLoader';
import styles from './styles/BorrowLend.module.scss';
import { toast } from 'react-toastify';
import { addBorrowLendRecord } from './utils/borrowLendFirestore';

function BorrowLend() {
    const [filterType, setFilterType] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const dueTrackingHook = useLendingTransactions();

    const {
        transactions,
        deleteTransaction,
        getTotalGiven,
        getTotalTaken,
        getNetBalance,
        getFilteredTransactions,
        loading,
        error,
        refreshTransactions,
    } = dueTrackingHook;

    const handleAddTransaction = async (newTransaction) => {
        try {
            await addBorrowLendRecord(newTransaction);
            setShowForm(false);
            await refreshTransactions();
            toast.success('Transaction added successfully');
        } catch (err) {
            console.error('Error adding transaction:', err);
            toast.error('Failed to add transaction');
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await deleteTransaction(id);
            toast.info('Transaction deleted');
        } catch (err) {
            console.error('Error deleting transaction:', err);
            toast.error('Failed to delete transaction');
        }
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
    };

    if (loading) {
        return <FullScreenLoader />;
    }

    if (error) {
        return (
            <Container className={styles.container}>
                <Row>
                    <Col lg={8} className="mx-auto">
                        <div className={styles.header}>
                            <h1>Borrow & Lending</h1>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                            <p>Error loading transactions: {error}</p>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className={styles.container}>
            <Row>
                <Col lg={8} className="mx-auto">
                    {/* Top Section with Greeting, Dashboard Cards, Add Button */}
                    <TopSection
                        totalGiven={getTotalGiven()}
                        totalTaken={getTotalTaken()}
                        netBalance={getNetBalance()}
                        onAddClick={() => setShowForm(!showForm)}
                    />
                    {showForm && (
                        <div className={styles.formWrapper}>
                            <AddTransactionForm onAddTransaction={handleAddTransaction} />
                        </div>
                    )}

                    {/* Due Tracking Section */}
                    <DueTrackingSection
                        dueTrackingHook={dueTrackingHook}
                        currency={currency}
                    />

                    {/* BorrowLend Table - Aggregated View */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600, color: '#1565c0' }}>
                            Summary
                        </h3>
                        <BorrowLendTable
                            transactions={transactions}
                            currency={currency}
                        />
                    </div>

                    {/* Add Transaction Form - Conditional */}


                    {/* Transaction List */}
                    <TransactionList
                        transactions={getFilteredTransactions(filterType)}
                        filterType={filterType}
                        onFilterChange={handleFilterChange}
                        onDelete={handleDeleteTransaction}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export default BorrowLend;
