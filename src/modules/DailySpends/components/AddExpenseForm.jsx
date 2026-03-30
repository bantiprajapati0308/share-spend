import { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Spinner } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';
import { getCurrencySymbol } from '../../../Util';
import CategorySelectDropdown from './CategorySelectDropdown';
import CategoryManagementModal from './CategoryManagementModal';
import TransactionTypeSelector from './common/TransactionTypeSelector';

function AddExpenseForm({ onAddExpense }) {
    const [transactionType, setTransactionType] = useState('spend');
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

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
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            category: category.categoryName,
            date: date,
            notes: notes,
        };

        try {
            setIsSubmitting(true);
            await onAddExpense(newTransaction);

            // Reset form only on success
            setExpenseName('');
            setAmount('');
            setCategory(null);
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
                <h3>➕ Add {transactionType === 'spend' ? 'Expense' : 'Income'}</h3>
                <TransactionTypeSelector
                    value={transactionType}
                    onChange={setTransactionType}
                    showLabel={false}
                />
            </div>

            <Row className="g-2">
                <Col xs={12} sm={6} md={4}>
                    <div className={styles.formGroup}>
                        <label>Name *</label>
                        <input
                            type="text"
                            placeholder="Coffee, Groceries..."
                            value={expenseName}
                            onChange={(e) => setExpenseName(e.target.value)}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <div className={styles.formGroup}>
                        <label>Amount *</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e62d0', minWidth: '20px' }}>
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
                <Col xs={12} sm={6} md={2}>
                    <div className={styles.formGroup}>
                        <label>Date *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                const dateValue = e.target.value;
                                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                                    setDate(dateValue);
                                }
                            }}
                            required
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6} md={3}>
                    <div className={styles.formGroup}>

                        <CategorySelectDropdown
                            value={category}
                            onChange={(selected) => setCategory(selected)}
                            type={transactionType}
                            placeholder="Select..."
                        >
                            <button
                                type="button"
                                className={styles.addCategoryIconBtn}
                                onClick={() => setShowCategoryModal(true)}
                                title="Manage categories"
                            >
                                <Plus size={16} />
                            </button>
                        </CategorySelectDropdown>
                    </div>
                </Col>
            </Row>

            <div className={styles.formGroup} style={{ marginBottom: '0.75rem' }}>
                <label>Notes (Optional)</label>
                <textarea
                    placeholder="Add notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ minHeight: '50px' }}
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Spinner animation="border" size="sm" style={{ width: '16px', height: '16px', marginRight: '0.4rem' }} />
                        Adding...
                    </>
                ) : (
                    <>
                        <Plus size={18} style={{ marginRight: '0.4rem' }} />
                        Add
                    </>
                )}
            </button>

            <CategoryManagementModal
                show={showCategoryModal}
                onHide={() => setShowCategoryModal(false)}
            />
        </form>
    );
}

AddExpenseForm.propTypes = {
    onAddExpense: PropTypes.func.isRequired,
};

export default AddExpenseForm;
