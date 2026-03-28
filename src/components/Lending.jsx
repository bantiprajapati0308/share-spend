import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Trash3, Plus, HandThumbsUp, HandThumbsDown } from 'react-bootstrap-icons';
import styles from '../assets/scss/Lending.module.scss';
import { getCurrencySymbol } from '../Util';
import { toast } from 'react-toastify';

function Lending() {
    const [transactions, setTransactions] = useState([]);
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('lent');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [filterType, setFilterType] = useState('all');
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    // Load transactions from localStorage
    useEffect(() => {
        const savedTransactions = localStorage.getItem('lendingTransactions');
        if (savedTransactions) {
            try {
                setTransactions(JSON.parse(savedTransactions));
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        }
    }, []);

    // Save transactions to localStorage
    useEffect(() => {
        localStorage.setItem('lendingTransactions', JSON.stringify(transactions));
    }, [transactions]);

    const handleAddTransaction = (e) => {
        e.preventDefault();

        if (!personName.trim() || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        const newTransaction = {
            id: Date.now(),
            personName: personName,
            amount: parseFloat(amount),
            type: type,
            date: date,
            description: description,
            createdAt: new Date().toISOString(),
        };

        setTransactions([newTransaction, ...transactions]);

        // Reset form
        setPersonName('');
        setAmount('');
        setType('lent');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');

        toast.success(`Amount ${type === 'lent' ? 'lent' : 'borrowed'} successfully!`);
    };

    const handleDeleteTransaction = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
        toast.info('Transaction deleted');
    };

    const getTotalLent = () => {
        return transactions
            .filter(t => t.type === 'lent')
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    };

    const getTotalBorrowed = () => {
        return transactions
            .filter(t => t.type === 'borrowed')
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    };

    const getNetBalance = () => {
        const lent = parseFloat(getTotalLent());
        const borrowed = parseFloat(getTotalBorrowed());
        return (lent - borrowed).toFixed(2);
    };

    const getFilteredTransactions = () => {
        if (filterType === 'all') return transactions;
        return transactions.filter(t => t.type === filterType);
    };

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
                    <div className={styles.dashboardGrid}>
                        <div className={`${styles.dashboardCard} ${styles.lent}`}>
                            <div className={styles.cardIcon}>
                                <HandThumbsUp size={40} />
                            </div>
                            <div className={styles.cardLabel}>Total Lent</div>
                            <div className={styles.cardValue}>
                                {currencySymbol}{getTotalLent()}
                            </div>
                        </div>

                        <div className={`${styles.dashboardCard} ${styles.borrowed}`}>
                            <div className={styles.cardIcon}>
                                <HandThumbsDown size={40} />
                            </div>
                            <div className={styles.cardLabel}>Total Borrowed</div>
                            <div className={styles.cardValue}>
                                {currencySymbol}{getTotalBorrowed()}
                            </div>
                        </div>

                        <div className={`${styles.dashboardCard} ${styles.balance}`}>
                            <div className={styles.cardIcon}>
                                💰
                            </div>
                            <div className={styles.cardLabel}>Net Balance</div>
                            <div className={styles.cardValue}>
                                {currencySymbol}{getNetBalance()}
                            </div>
                        </div>
                    </div>

                    {/* Add Transaction Form */}
                    <form onSubmit={handleAddTransaction} className={styles.formSection}>
                        <h3>Add New Transaction</h3>

                        <div className={styles.formGroup}>
                            <label>Transaction Type *</label>
                            <div className={styles.typeToggle}>
                                <div>
                                    <input
                                        type="radio"
                                        id="lent"
                                        name="type"
                                        value="lent"
                                        checked={type === 'lent'}
                                        onChange={(e) => setType(e.target.value)}
                                    />
                                    <label htmlFor="lent" style={{ margin: 0, cursor: 'pointer' }}>
                                        I Lent Money
                                    </label>
                                </div>
                                <div>
                                    <input
                                        type="radio"
                                        id="borrowed"
                                        name="type"
                                        value="borrowed"
                                        checked={type === 'borrowed'}
                                        onChange={(e) => setType(e.target.value)}
                                    />
                                    <label htmlFor="borrowed" style={{ margin: 0, cursor: 'pointer' }}>
                                        I Borrowed Money
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Row>
                            <Col md={6}>
                                <div className={styles.formGroup}>
                                    <label>Person's Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., John Doe"
                                        value={personName}
                                        onChange={(e) => setPersonName(e.target.value)}
                                    />
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.formGroup}>
                                    <label>Amount *</label>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e62d0' }}>
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            step="0.01"
                                            min="0"
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className={styles.formGroup}>
                            <label>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description (Optional)</label>
                            <textarea
                                placeholder="Add any notes about this transaction..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            <Plus size={20} className="me-2" />
                            Add Transaction
                        </button>
                    </form>

                    {/* Transaction List */}
                    <div className={styles.transactionList}>
                        <h3>Transaction History</h3>

                        {transactions.length > 0 && (
                            <div className={styles.filterTabs}>
                                <button
                                    className={filterType === 'all' ? styles.active : ''}
                                    onClick={() => setFilterType('all')}
                                >
                                    All Transactions ({transactions.length})
                                </button>
                                <button
                                    className={filterType === 'lent' ? styles.active : ''}
                                    onClick={() => setFilterType('lent')}
                                >
                                    Lent ({transactions.filter(t => t.type === 'lent').length})
                                </button>
                                <button
                                    className={filterType === 'borrowed' ? styles.active : ''}
                                    onClick={() => setFilterType('borrowed')}
                                >
                                    Borrowed ({transactions.filter(t => t.type === 'borrowed').length})
                                </button>
                            </div>
                        )}

                        {getFilteredTransactions().length === 0 ? (
                            <div className={styles.noTransactions}>
                                <p>No transactions yet. Start tracking your lending and borrowing above!</p>
                            </div>
                        ) : (
                            <>
                                {getFilteredTransactions().map((transaction) => (
                                    <div key={transaction.id} className={styles.transactionItem}>
                                        <div className={styles.transactionInfo}>
                                            <div className={styles.transactionName}>
                                                {transaction.personName}
                                            </div>
                                            <div className={`${styles.transactionType} ${styles[transaction.type]}`}>
                                                {transaction.type === 'lent' ? '✓ Lent' : '↓ Borrowed'}
                                            </div>
                                            {transaction.description && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                                    {transaction.description}
                                                </div>
                                            )}
                                            <div className={styles.transactionDate}>
                                                {new Date(transaction.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className={`${styles.transactionAmount} ${styles[transaction.type]}`}>
                                            {transaction.type === 'lent' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                                        </div>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                        >
                                            <Trash3 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Lending;
