import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Spinner, Button } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';
import CategorySelectDropdown from './CategorySelectDropdown';
import CategoryManagementModal from './CategoryManagementModal';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import PersonNameDropdown from '../../../components/common/PersonNameDropdown';
import TopCategories from './TopCategories';

function AddExpenseForm({ onAddExpense, onLimitsClick }) {
    const [transactionType, setTransactionType] = useState('spend');
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [personName, setPersonName] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clear category when transaction type changes to prevent wrong entries
    useEffect(() => {
        setCategory(null);
        setPersonName(''); // Also clear person name when switching types
    }, [transactionType]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((!isLendingTransaction && !expenseName.trim()) || !amount || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Check if person name is required and provided
        if (isLendingTransaction && !personName.trim()) {
            toast.error('Please select or enter a person name');
            return;
        }

        const baseTransactionObj = {
            type: transactionType,
            name: isLendingTransaction ? personName.trim() : expenseName,
            amount: parseFloat(amount),
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            category: category.categoryName,
            categoryIcon: category.emoji || '📝',
            date: date,
            notes: notes,
        }
        const isDueDate = category && (category.categoryName.toLowerCase() === 'lent' || category.categoryName.toLowerCase() === 'borrowed');

        const newTransaction = {
            ...baseTransactionObj,
            ...(isDueDate ? { dueDate: dueDate || null } : {}),
        };

        try {
            setIsSubmitting(true);
            await onAddExpense(newTransaction);

            // Reset form only on success
            setExpenseName('');
            setAmount('');
            setCategory(null);
            setDate(new Date().toISOString().split('T')[0]);
            setDueDate('');
            setPersonName('');
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
    const isLent = category && category.categoryName.toLowerCase() === 'lent';
    const isRepayment = category && category.categoryName.toLowerCase() === 'repayment';
    const isBorrowed = category && category.categoryName.toLowerCase() === 'borrowed';
    const isBorrowedPay = category && category.categoryName.toLowerCase() === 'borrowed pay';
    // Check if it's a lending-related transaction that requires person name
    const isLendingTransaction = isLent || isRepayment || isBorrowed || isBorrowedPay;
    return (
        <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.formHeader}>
                <div className='d-flex align-items-center justify-content-between mb-4'> <h3 className='mb-0'>➕ Add {transactionType === 'spend' ? 'Expense' : 'Income'} </h3> <Button
                    variant="link"
                    onClick={onLimitsClick}
                    className={styles.reportBtn}
                    size="sm"
                >
                    Spending Limits
                </Button></div>
                <TransactionTypeSelector
                    value={transactionType}
                    onChange={setTransactionType}
                    showLabel={false}
                />
            </div>

            <Row className="g-1">
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
                <Col xs={12} sm={6} md={3}>
                    <TopCategories
                        selectedCategory={(cat) => setCategory(cat)}
                        transactionType={transactionType}
                    />
                </Col>
                <Col xs={5} sm={6} md={isLendingTransaction ? 3 : 3}>
                    <div className={styles.formGroup}>
                        <label>Amount *</label>
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
                </Col>

                {isLendingTransaction ? (
                    <Col xs={7} sm={6} md={3}>
                        <div className={styles.formGroup}>
                            <label>Person Name *</label>
                            <PersonNameDropdown
                                value={personName}
                                onChange={setPersonName}
                                placeholder="Person name..."
                            />
                        </div>
                    </Col>
                ) : <Col xs={7} sm={6} md={3}>
                    <div className={styles.formGroup}>
                        <label>Name *</label>
                        <input
                            type="text"
                            placeholder="Coffee, Groceries..."
                            value={expenseName}
                            onChange={(e) => setExpenseName(e.target.value)}
                        />
                    </div>
                </Col>}



                <Col xs={(isLent || isBorrowed) ? 6 : 12} sm={6} md={2}>
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
                {(isLent || isBorrowed) && (
                    <Col xs={6} sm={6} md={4}>
                        <div className={styles.formGroup}>
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => {
                                    const dateValue = e.target.value;
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                                        setDueDate(dateValue);
                                    }
                                }}
                                min={date}
                            />
                        </div>
                    </Col>
                )}

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
