import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Spinner } from 'react-bootstrap';
import { Plus, PencilSquare, CheckCircleFill, ExclamationTriangleFill, ExclamationCircleFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
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
import { formatLocalDate } from '../utils/dateUtils';
import { TRANSACTION_TYPES } from '../../BorrowLend/constants/transactionTypes';
import QuickAddPanel from '../QuickAdd/components/QuickAddPanel';

function AddExpenseForm({
    onAddExpense,
    onAddTransactionsBulk,
    onUpdateExpense,
    editingTransaction,
    isEditMode,
    onCancelEdit,
    onGoToCategories,
    inlineQuickAddEdit = false,
    quickAddConfidence,
    onConfirmQuickAddField,
}) {
    const nowDatetime = () => {
        const d = new Date();
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${mo}-${day}T${h}:${min}`;
    };

    const [transactionType, setTransactionType] = useState('spend');
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(null);
    const [date, setDate] = useState(nowDatetime);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [personName, setPersonName] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const { categories } = useCategoryContext();
    const quickAddStatus = useSelector((state) => state.quickAdd.status);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (!isEditMode || !editingTransaction) return;
        // AI returns "expense"; the shared form toggle uses "spend".
        setTransactionType(editingTransaction.type === 'income' ? 'income' : 'spend');
        setExpenseName(editingTransaction.name || '');
        setAmount(editingTransaction.amount?.toString() || '');
        setCategory({
            categoryId: editingTransaction.categoryId || null,
            // Resolve live name+emoji by ID so renames are reflected immediately
            ...(() => {
                const live = editingTransaction.categoryId ? categories.find(c => c.id === editingTransaction.categoryId) : null;
                const fallbackName = editingTransaction.categoryName || editingTransaction.category || '';
                const fallbackLabel = editingTransaction.categoryIcon ? `${editingTransaction.categoryIcon} ${fallbackName}`.trim() : fallbackName;

                return live
                    ? { categoryName: live.name, emoji: live.emoji, label: `${live.emoji} ${live.name}` }
                    : { categoryName: fallbackName, emoji: editingTransaction.categoryIcon || '??', label: fallbackLabel || 'Uncategorized' };
            })(),
        });
        setDate(editingTransaction.date || nowDatetime());
        setDueDate(editingTransaction.dueDate || '');
        setNotes(editingTransaction.notes || '');

        // Restore payment method selection
        setPaymentMethodId(editingTransaction.paymentMethodId || null);

        const catName = String(editingTransaction.categoryName || editingTransaction.category || '').toLowerCase();
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
        setDate(nowDatetime());
        setDueDate('');
        setPersonName('');
        setNotes('');
        setPaymentMethodId(null);
    };
    const cancelHanlder = () => {
        resetForm();
        onCancelEdit && onCancelEdit();
    };
    const toggleHandler = (type) => {
        resetForm();
        setTransactionType(type);
    };
    const handleSubmit = async (e) => {
        e?.preventDefault();

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

        const isDueDate = category && category.categoryName &&
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
                toast.success(inlineQuickAddEdit ? 'Draft updated' : `${label} updated successfully!`);
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

    const isLent = !!category && !!category.categoryName && category.categoryName.toLowerCase() === 'lent';
    const isRepayment = !!category && !!category.categoryName && category.categoryName.toLowerCase() === 'repayment';
    const isBorrowed = !!category && !!category.categoryName && category.categoryName.toLowerCase() === 'borrowed';
    const isBorrowedPay = !!category && !!category.categoryName && category.categoryName.toLowerCase() === 'borrowed pay';
    const isLendingTransaction = isLent || isRepayment || isBorrowed || isBorrowedPay;
    const personNameType = (isLent || isRepayment)
        ? TRANSACTION_TYPES.GAVE
        : (isBorrowed || isBorrowedPay)
            ? TRANSACTION_TYPES.TOOK
            : undefined;
    const FormContainer = inlineQuickAddEdit ? 'div' : 'form';
    const getConfidence = (field) => quickAddConfidence?.[`${field}Confidence`] || 'high';
    const getStatus = (field) => quickAddConfidence?.[`${field}Status`] || (getConfidence(field) === 'high' ? 'confirmed' : 'pending');
    const confirmField = (field) => onConfirmQuickAddField?.(field);
    const fieldClassName = (field) => `${styles.quickAddReviewField} ${styles[`quickAddReviewField${getStatus(field) === 'confirmed' ? 'confirmed' : getConfidence(field)}`]}`;
    const inputClassName = (field) => inlineQuickAddEdit ? styles[`quickAddInput${getStatus(field) === 'confirmed' ? 'confirmed' : getConfidence(field)}`] : '';
    const FieldIndicator = ({ field, label }) => {
        const confidence = getConfidence(field);
        const confirmed = getStatus(field) === 'confirmed';
        const Icon = confirmed ? CheckCircleFill : confidence === 'low' ? ExclamationCircleFill : ExclamationTriangleFill;
        return <button type="button" className={`${styles.quickAddFieldIndicator} ${field === 'date' ? styles.quickAddDateIndicator : ''}`} onClick={() => confirmField(field)} title={confirmed ? `${label} confirmed` : `${label} needs review`} aria-label={confirmed ? `Confirm ${label}` : `Review ${label}`}><Icon /></button>;
    };
    FieldIndicator.propTypes = { field: PropTypes.string.isRequired, label: PropTypes.string.isRequired };

    return (
        <FormContainer onSubmit={inlineQuickAddEdit ? undefined : handleSubmit} className={`${styles.formSection} ${inlineQuickAddEdit ? styles.inlineQuickAddForm : ''}`}>
            {!inlineQuickAddEdit && <QuickAddPanel categories={categories} onAddTransactionsBulk={onAddTransactionsBulk} />}
            <div className={!inlineQuickAddEdit && quickAddStatus === 'review' ? styles.manualFormHidden : ''}>
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
                    onChange={type => toggleHandler(type)}
                    showLabel={false}
                    compact={inlineQuickAddEdit}
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
                <div className={`${styles.quickAddInputControl} ${inlineQuickAddEdit ? fieldClassName('category') : ''}`}>
                    <CategorySelectDropdown
                        value={category}
                        onChange={(value) => { setCategory(value); confirmField('category'); }}
                        type={transactionType}
                        placeholder="Search category..."
                        confidenceState={inlineQuickAddEdit ? (getStatus('category') === 'confirmed' ? 'confirmed' : getConfidence('category')) : undefined}
                    />
                    {inlineQuickAddEdit && <FieldIndicator field="category" label="Category" />}
                </div>
                <div className={styles.topCategoriesRow}>
                    <TopCategories
                        selectedCategory={(value) => { setCategory(value); confirmField('category'); }}
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
                        <div className={`${styles.quickAddInputControl} ${inlineQuickAddEdit ? fieldClassName('amount') : ''}`}>
                            <AmountInput className={inputClassName('amount')} placeholder="0.00 or 10+5" value={amount} onValueChange={(value) => { setAmount(value); confirmField('amount'); }} onInvalidExpression={(msg) => toast.error(msg)} />
                            {inlineQuickAddEdit && <FieldIndicator field="amount" label="Amount" />}
                        </div>
                    </div>
                </Col>
                <Col xs={7}>
                    {isLendingTransaction ? (
                        <div className={styles.formGroup}>
                            <label>Person Name *</label>
                            <div className={`${styles.quickAddInputControl} ${inlineQuickAddEdit ? fieldClassName('name') : ''}`}>
                                <PersonNameDropdown value={personName} onChange={(value) => { setPersonName(value); confirmField('name'); }} placeholder="Person name..." type={personNameType} />
                                {inlineQuickAddEdit && <FieldIndicator field="name" label="Person name" />}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <div className={`${styles.quickAddInputControl} ${inlineQuickAddEdit ? fieldClassName('name') : ''}`}>
                                <input className={inputClassName('name')} type="text" placeholder="e.g. Coffee, Groceries..." value={expenseName} onChange={(e) => { setExpenseName(e.target.value); confirmField('name'); }} />
                                {inlineQuickAddEdit && <FieldIndicator field="name" label="Expense name" />}
                            </div>
                        </div>
                    )}
                </Col>
            </Row>

            {/* -- Date ---------------------------------------------------- */}
            <Row className="g-2">
                <Col xs={(isLent || isBorrowed) ? 6 : 12}>
                    <div className={styles.formGroup}>
                        <div className={`${styles.quickAddInputControl} ${inlineQuickAddEdit ? fieldClassName('date') : ''}`}>
                            <DatePickerInput inputClassName={inputClassName('date')} label="Date *" value={date} onChange={(val) => { if (val) { setDate(val); confirmField('date'); confirmField('time'); } }} maxDate={formatLocalDate(new Date())} required placeholder="Select date & time" showTimeSelect />
                            {inlineQuickAddEdit && <FieldIndicator field="date" label="Date and time" />}
                        </div>
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
            <PaymentMethodSelector compact={inlineQuickAddEdit} value={paymentMethodId} onChange={(value) => { setPaymentMethodId(value); confirmField('paymentMethod'); }} />

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
                <button type={inlineQuickAddEdit ? 'button' : 'submit'} onClick={inlineQuickAddEdit ? handleSubmit : undefined} className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Spinner animation="border" size="sm" style={{ width: '16px', height: '16px', marginRight: '0.4rem' }} />
                            {isEditMode ? (inlineQuickAddEdit ? 'Saving...' : 'Updating...') : 'Adding...'}
                        </>
                    ) : (
                        <>
                            <Plus size={18} style={{ marginRight: '0.4rem' }} />
                            {isEditMode ? (inlineQuickAddEdit ? 'Save' : 'Update') : `Add ${transactionType === 'spend' ? 'Expense' : 'Income'}`}
                        </>
                    )}
                </button>
                {isEditMode && (
                    <button
                        type="button"
                        className={`${styles.submitBtn} ${styles.cancelBtn}`}
                        onClick={cancelHanlder}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                )}
            </div>
            </div>
        </FormContainer>
    );
}

AddExpenseForm.propTypes = {
    onAddExpense: PropTypes.func,
    onAddTransactionsBulk: PropTypes.func,
    onUpdateExpense: PropTypes.func,
    editingTransaction: PropTypes.object,
    isEditMode: PropTypes.bool,
    onCancelEdit: PropTypes.func,
    onGoToCategories: PropTypes.func,
    inlineQuickAddEdit: PropTypes.bool,
    quickAddConfidence: PropTypes.object,
    onConfirmQuickAddField: PropTypes.func,
};

export default AddExpenseForm;
