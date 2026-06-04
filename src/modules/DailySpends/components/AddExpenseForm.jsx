import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Spinner } from 'react-bootstrap';
import { Plus, PencilSquare } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import DatePickerInput from '../../../utils/DatePickerInput';
import styles from '../styles/DailySpends.module.scss';
import CategorySelectDropdown from './CategorySelectDropdown';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import PersonNameDropdown from '../../../components/common/PersonNameDropdown';
import TopCategories from './TopCategories';
import AmountInput from '../../../utils/AmountInput';
import { evaluateAmountExpression } from '../../../utils/amountExpression';
import useCategoryContext from '../hooks/useCategoryContext';
import PaymentMethodSelector from './common/PaymentMethodSelector';

function AddExpenseForm({
    onAddExpense,
    onUpdateExpense,
    editingTransaction,
    isEditMode,
    onCancelEdit,
    onCategoriesChanged,
    onGoToCategories,
}) {
    const [transactionType, setTransactionType] = useState('spend');
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [personName, setPersonName] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const { categories } = useCategoryContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const skipTypeClear = useRef(false);

    // Clear category & person name when type changes
    // skipTypeClear prevents clearing when type is set programmatically during edit population
    useEffect(() => {
        if (skipTypeClear.current) {
            skipTypeClear.current = false;
            return;
        }
        setCategory(null);
        setPersonName('');
    }, [transactionType]);

    // Populate form when editing
    useEffect(() => {
        if (!isEditMode || !editingTransaction) return;
        skipTypeClear.current = true; // flag so the clear effect ignores this programmatic type change
        setTransactionType(editingTransaction.type || 'spend');
        setExpenseName(editingTransaction.name || '');
        setAmount(editingTransaction.amount?.toString() || '');
        setCategory({
            categoryId: editingTransaction.categoryId,
            // Resolve live name+emoji by ID so renames are reflected immediately
            ...(() => {
                const live = categories.find(c => c.id === editingTransaction.categoryId);
                return live
                    ? { categoryName: live.name, emoji: live.emoji, label: `${live.emoji} ${live.name}` }
                    : { categoryName: editingTransaction.categoryName || editingTransaction.category, emoji: editingTransaction.categoryIcon || '??', label: `${editingTransaction.categoryIcon} ${editingTransaction.categoryName}` };
            })(),
        });
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setDueDate(editingTransaction.dueDate || '');
        setNotes(editingTransaction.notes || '');

        // Restore payment method selection
        setPaymentMethodId(editingTransaction.paymentMethodId || null);

        const catName = (editingTransaction.categoryName || editingTransaction.category || '').toLowerCase();
        if (['lent', 'repayment', 'borrowed', 'borrowed pay'].includes(catName)) {
            setPersonName(editingTransaction.name || '');
            setExpenseName('');
        } else {
            setPersonName('');
        }
    }, [isEditMode, editingTransaction, categories]);

    const resetForm = () => {
        setExpenseName('');
        setAmount('');
        setCategory(null);
        setDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setPersonName('');
        setNotes('');
        setPaymentMethodId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((!isLendingTransaction && !expenseName.trim()) || !amount.trim() || !category || !paymentMethodId) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (isLendingTransaction && !personName.trim()) {
            toast.error('Please select or enter a person name');
            return;
        }

        let parsedAmount;
        try {
            parsedAmount = evaluateAmountExpression(amount);
            setAmount(String(parsedAmount));
        } catch (error) {
            toast.error(error.message || 'Invalid amount expression.');
            return;
        }

        const isDueDate = category &&
            ['lent', 'borrowed'].includes(category.categoryName.toLowerCase());

        const newTransaction = {
            type: transactionType,
            name: isLendingTransaction ? personName.trim() : expenseName,
            amount: parsedAmount,
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            category: category.categoryName,
            categoryIcon: category.emoji || '??',
            date,
            notes,
            paymentMethodId: paymentMethodId || null,
            ...(isDueDate ? { dueDate: dueDate || null } : {}),
        };

        try {
            setIsSubmitting(true);
            const label = transactionType === 'spend' ? 'Expense' : 'Income';
            if (isEditMode) {
                await onUpdateExpense(newTransaction);
                toast.success(`${label} updated successfully!`);
            } else {
                await onAddExpense(newTransaction);
                toast.success(`${label} added successfully!`);
            }
            resetForm();
        } catch (error) {
            toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'add'} transaction.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLent = category && category.categoryName.toLowerCase() === 'lent';
    const isRepayment = category && category.categoryName.toLowerCase() === 'repayment';
    const isBorrowed = category && category.categoryName.toLowerCase() === 'borrowed';
    const isBorrowedPay = category && category.categoryName.toLowerCase() === 'borrowed pay';
    const isLendingTransaction = isLent || isRepayment || isBorrowed || isBorrowedPay;

    return (
        <form onSubmit={handleSubmit} className={styles.formSection}>
            {/* -- Header --------------------------------------------------- */}
            <div className={styles.formHeader}>
                <div className={styles.formHeaderRow}>
                    <h3 className={styles.formTitle}>
                        {isEditMode
                            ? <PencilSquare size={18} style={{ marginRight: '0.4rem' }} />
                            : <Plus size={20} style={{ marginRight: '0.4rem' }} />}
                        {isEditMode ? 'Edit' : 'Add'}{' '}
                        {transactionType === 'spend' ? 'Expense' : 'Income'}
                    </h3>
                </div>
                <TransactionTypeSelector
                    value={transactionType}
                    onChange={setTransactionType}
                    showLabel={false}
                />
            </div>

            {/* -- Category ------------------------------------------------- */}
            <div className={styles.formGroup}>
                <div className={styles.categoryLabelRow}>
                    <label>Category *</label>
                    {onGoToCategories && (
                        <button
                            type="button"
                            className={styles.addNewLink}
                            onClick={onGoToCategories}
                        >
                            + Add New
                        </button>
                    )}
                </div>
                <CategorySelectDropdown
                    value={category}
                    onChange={setCategory}
                    type={transactionType}
                    placeholder="Search category..."
                />
                <div className={styles.topCategoriesRow}>
                    <TopCategories
                        selectedCategory={setCategory}
                        transactionType={transactionType}
                        onGoToCategories={onGoToCategories}
                    />
                </div>
            </div>

            {/* -- Amount + Name/Person ------------------------------------- */}
            <Row className="g-2">
                <Col xs={5}>
                    <div className={styles.formGroup}>
                        <label>Amount *</label>
                        <AmountInput
                            placeholder="0.00 or 10+5"
                            value={amount}
                            onValueChange={setAmount}
                            onInvalidExpression={(msg) => toast.error(msg)}
                        />
                    </div>
                </Col>
                <Col xs={7}>
                    {isLendingTransaction ? (
                        <div className={styles.formGroup}>
                            <label>Person Name *</label>
                            <PersonNameDropdown
                                value={personName}
                                onChange={setPersonName}
                                placeholder="Person name..."
                            />
                        </div>
                    ) : (
                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Coffee, Groceries..."
                                value={expenseName}
                                onChange={(e) => setExpenseName(e.target.value)}
                            />
                        </div>
                    )}
                </Col>
            </Row>

            {/* -- Date ---------------------------------------------------- */}
            <Row className="g-2">
                <Col xs={(isLent || isBorrowed) ? 6 : 12}>
                    <div className={styles.formGroup}>
                        <DatePickerInput
                            label="Date *"
                            value={date}
                            onChange={(val) => val && setDate(val)}
                            maxDate={new Date().toISOString().split('T')[0]}
                            required
                            placeholder="Select date"
                        />
                    </div>
                </Col>
                {(isLent || isBorrowed) && (
                    <Col xs={6}>
                        <div className={styles.formGroup}>
                            <DatePickerInput
                                label="Due Date"
                                value={dueDate}
                                onChange={setDueDate}
                                minDate={date}
                                isClearable
                                placeholder="Select due date"
                            />
                        </div>
                    </Col>
                )}
            </Row>

            {/* -- Payment Method ------------------------------------------- */}
            <PaymentMethodSelector value={paymentMethodId} onChange={setPaymentMethodId} />

            {/* -- Notes --------------------------------------------------- */}
            <div className={styles.formGroup}>
                <label>Notes (Optional)</label>
                <textarea
                    placeholder="Add notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ minHeight: '50px' }}
                />
            </div>

            {/* -- Submit -------------------------------------------------- */}
            <div className="d-flex gap-2">
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Spinner animation="border" size="sm" style={{ width: '16px', height: '16px', marginRight: '0.4rem' }} />
                            {isEditMode ? 'Updating...' : 'Adding...'}
                        </>
                    ) : (
                        <>
                            <Plus size={18} style={{ marginRight: '0.4rem' }} />
                            {isEditMode ? 'Update' : `Add ${transactionType === 'spend' ? 'Expense' : 'Income'}`}
                        </>
                    )}
                </button>
                {isEditMode && (
                    <button
                        type="button"
                        className={`${styles.submitBtn} ${styles.cancelBtn}`}
                        onClick={onCancelEdit}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

AddExpenseForm.propTypes = {
    onAddExpense: PropTypes.func.isRequired,
    onUpdateExpense: PropTypes.func,
    editingTransaction: PropTypes.object,
    isEditMode: PropTypes.bool,
    onCancelEdit: PropTypes.func,
    onCategoriesChanged: PropTypes.func,
    onGoToCategories: PropTypes.func,
};

export default AddExpenseForm;
