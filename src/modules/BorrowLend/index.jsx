import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLendingTransactions } from './hooks/useLendingTransactions';
import DashboardCards from './components/DashboardCards';
import AddTransactionForm from './components/AddTransactionForm';
import TransactionList from './components/TransactionList';
import styles from './styles/BorrowLend.module.scss';
import { toast } from 'react-toastify';

function BorrowLend() {
    const [filterType, setFilterType] = useState('all');
    const {
        transactions,
        addTransaction,
        deleteTransaction,
        getTotalLent,
        getTotalBorrowed,
        getNetBalance,
        getFilteredTransactions,
    } = useLendingTransactions();

    const handleAddTransaction = (newTransaction) => {
        addTransaction(newTransaction);
    };

    const handleDeleteTransaction = (id) => {
        deleteTransaction(id);
        toast.info('Transaction deleted');
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
    };

    const filteredTransactions = getFilteredTransactions(filterType);

    return (
        <Container className={styles.container}>
            <Row>
                <Col lg={8} className="mx-auto">
                    {/* Header */}
                    <div className={styles.header}>
                        <h1>Borrow & Lending</h1>
                        <p>Track money you've lent and borrowed from friends</p>
                    </div>

                    {/* Dashboard Cards */}
                    <DashboardCards
                        totalLent={getTotalLent()}
                        totalBorrowed={getTotalBorrowed()}
                        netBalance={getNetBalance()}
                    />

                    {/* Add Transaction Form */}
                    <AddTransactionForm onAddTransaction={handleAddTransaction} />

                    {/* Transaction List */}
                    <TransactionList
                        transactions={filteredTransactions}
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
