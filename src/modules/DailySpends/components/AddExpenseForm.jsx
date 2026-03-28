import React, { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import Select from 'react-select';
import styles from '../styles/DailySpends.module.scss';
import { getCurrencySymbol } from '../../../Util';
import { useCategories } from '../hooks/useCategories';
import CategoryManagementModal from './CategoryManagementModal';

function AddExpenseForm({ onAddExpense }) {
    const { getCategoriesForSelect, getCategoryByValue } = useCategories();
    let categoryOptions = getCategoriesForSelect();

    const [transactionType, setTransactionType] = useState('spend');
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categoryOptions[0] || null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    const handleCategoryAdded = () => {
        // Refresh category options
        categoryOptions = getCategoriesForSelect();
        setCategory(categoryOptions[0] || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!expenseName.trim() || !amount || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        const newTransaction = {
            type: transactionType,
            name: expenseName,
            amount: parseFloat(amount),
            category: category.value,
            date: date,
            notes: notes,
        };

        try {
            setIsSubmitting(true);
            await onAddExpense(newTransaction);

            // Reset form only on success
            setExpenseName('');
            setAmount('');
            setCategory(categoryOptions[0] || null);
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');

            const title = transactionType === 'spend' ? 'Expense' : 'Income';
            toast.success(`${title} added successfully!`);
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error(error.message || 'Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.formHeader}>
                <h3>Add Transaction</h3>
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="transactionType"
                            value="spend"
                            checked={transactionType === 'spend'}
                            onChange={(e) => setTransactionType(e.target.value)}
                        />
                        <span className={styles.radioText}>Spend</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="transactionType"
                            value="income"
                            checked={transactionType === 'income'}
                            onChange={(e) => setTransactionType(e.target.value)}
                        />
                        <span className={styles.radioText}>Income</span>
                    </label>
                </div>
            </div>

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
                        <div className={styles.labelWithButton}>
                            <label>Category</label>
                            <button
                                type="button"
                                className={styles.addCategoryIconBtn}
                                onClick={() => setShowCategoryModal(true)}
                                title="Add new category"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <Select
                            options={categoryOptions}
                            value={category}
                            onChange={(selected) => setCategory(selected)}
                            placeholder="Select a category..."
                            isSearchable
                            isClearable={false}
                            classNamePrefix="react-select"
                            formatOptionLabel={(option) => (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {option.label}
                                </div>
                            )}
                        />
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

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Spinner animation="border" size="sm" className="me-2" style={{ width: '18px', height: '18px' }} />
                        Adding...
                    </>
                ) : (
                    <>
                        <Plus size={20} className="me-2" />
                        {transactionType === 'spend' ? 'Add Expense' : 'Add Income'}
                    </>
                )}
            </button>

            {/* Category Management Modal */}
            <CategoryManagementModal
                show={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                useCategories={useCategories}
                onCategoryAdded={handleCategoryAdded}
            />
        </form>
    );
}

export default AddExpenseForm;
