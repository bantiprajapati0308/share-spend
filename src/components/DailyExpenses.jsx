import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Trash3, Plus, Calendar } from 'react-bootstrap-icons';
import styles from '../assets/scss/DailyExpenses.module.scss';
import { getCurrencySymbol } from '../Util';
import { toast } from 'react-toastify';

function DailyExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    // Load expenses from localStorage
    useEffect(() => {
        const savedExpenses = localStorage.getItem('dailyExpenses');
        if (savedExpenses) {
            try {
                setExpenses(JSON.parse(savedExpenses));
            } catch (error) {
                console.error('Error loading expenses:', error);
            }
        }
    }, []);

    // Save expenses to localStorage
    useEffect(() => {
        localStorage.setItem('dailyExpenses', JSON.stringify(expenses));
    }, [expenses]);

    const handleAddExpense = (e) => {
        e.preventDefault();

        if (!expenseName.trim() || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        const newExpense = {
            id: Date.now(),
            name: expenseName,
            amount: parseFloat(amount),
            category: category,
            date: date,
            notes: notes,
            createdAt: new Date().toISOString(),
        };

        setExpenses([newExpense, ...expenses]);

        // Reset form
        setExpenseName('');
        setAmount('');
        setCategory('Food');
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');

        toast.success('Expense added successfully!');
    };

    const handleDeleteExpense = (id) => {
        setExpenses(expenses.filter(expense => expense.id !== id));
        toast.info('Expense deleted');
    };

    const getTotalExpenses = () => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);
    };

    const getExpensesByCategory = () => {
        const categories = {};
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });
        return categories;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Food': '🍔',
            'Transport': '🚗',
            'Entertainment': '🎬',
            'Shopping': '🛍️',
            'Utilities': '💡',
            'Health': '🏥',
            'Other': '📝'
        };
        return icons[category] || '📝';
    };

    return (
        <Container className={styles.container}>
            <Row>
                <Col lg={8} className="mx-auto">
                    {/* Header */}
                    <div className={styles.header}>
                        <h1>Daily Expenses</h1>
                        <p>Track your daily spending and manage your budget</p>
                    </div>

                    {/* Summary Card */}
                    {expenses.length > 0 && (
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Spent This Month</div>
                            <div className={styles.summaryAmount}>
                                {currencySymbol}{getTotalExpenses()}
                            </div>
                        </div>
                    )}

                    {/* Add Expense Form */}
                    <form onSubmit={handleAddExpense} className={styles.formSection}>
                        <h3>Add New Expense</h3>

                        <Row>
                            <Col md={6}>
                                <div className={styles.formGroup}>
                                    <label>Expense Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Coffee, Groceries"
                                        value={expenseName}
                                        onChange={(e) => setExpenseName(e.target.value)}
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

                        <Row>
                            <Col md={6}>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option>Food</option>
                                        <option>Transport</option>
                                        <option>Entertainment</option>
                                        <option>Shopping</option>
                                        <option>Utilities</option>
                                        <option>Health</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.formGroup}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <div className={styles.formGroup}>
                            <label>Notes (Optional)</label>
                            <textarea
                                placeholder="Add any notes about this expense..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            <Plus size={20} className="me-2" />
                            Add Expense
                        </button>
                    </form>

                    {/* Expense List */}
                    <div className={styles.expenseList}>
                        <h3>
                            <Calendar size={24} className="me-2" />
                            Your Expenses
                        </h3>

                        {expenses.length === 0 ? (
                            <div className={styles.noExpenses}>
                                <p>No expenses yet. Start adding your daily expenses above!</p>
                            </div>
                        ) : (
                            <>
                                {expenses.map((expense) => (
                                    <div key={expense.id} className={styles.expenseItem}>
                                        <div className={styles.expenseInfo}>
                                            <div className={styles.expenseName}>
                                                {getCategoryIcon(expense.category)} {expense.name}
                                            </div>
                                            <div className={styles.expenseCategory}>
                                                {expense.category}
                                            </div>
                                            {expense.notes && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                                    {expense.notes}
                                                </div>
                                            )}
                                            <div className={styles.expenseDate}>
                                                {new Date(expense.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className={styles.expenseAmount}>
                                            {currencySymbol}{expense.amount.toFixed(2)}
                                        </div>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDeleteExpense(expense.id)}
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

export default DailyExpenses;
