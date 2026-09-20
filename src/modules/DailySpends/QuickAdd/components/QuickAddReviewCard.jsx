import { useState } from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleFill, PencilSquare, Trash3, ExclamationCircleFill, X } from 'react-bootstrap-icons';
import { categoryForId, displayPaymentMethod, formatQuickAddDateTime, getFieldExplanation } from '../quickAddUtils';
import AddExpenseForm from '../../components/AddExpenseForm';
import styles from '../QuickAdd.module.scss';

const CONFIDENCE_WEIGHT = { high: 0, medium: 1, low: 2 };

function QuickAddReviewCard({ transaction, index, categories, paymentMethods, onChange, onRemove }) {
    const category = categoryForId(categories, transaction.categoryId);
    const [isEditing, setIsEditing] = useState(false);
    const [activeHint, setActiveHint] = useState(null);
    const update = (changes) => onChange(index, changes);
    const stateFor = (field) => {
        const confidence = transaction[`${field}Confidence`] || 'high';
        return { confidence, status: transaction[`${field}Status`] || (confidence === 'high' ? 'confirmed' : 'pending') };
    };
    const dateState = [stateFor('date'), stateFor('time')].sort((a, b) => CONFIDENCE_WEIGHT[b.confidence] - CONFIDENCE_WEIGHT[a.confidence])[0];
    const reviewFields = [
        { field: 'category', label: 'Category', value: `${category?.emoji || '📦'} ${category?.name || 'Uncategorized'}`, ...stateFor('category') },
        { field: 'amount', label: 'Amount', value: `₹${Number(transaction.amount || 0).toLocaleString('en-IN')}`, ...stateFor('amount') },
        { field: 'name', label: 'Expense name', value: transaction.name || 'Untitled expense', ...stateFor('name') },
        { field: 'date', label: 'Date & time', value: formatQuickAddDateTime(transaction), ...dateState },
    ];
    const summaryBadges = [
        ...reviewFields,
        { field: 'paymentMethod', label: 'Payment method', value: displayPaymentMethod(paymentMethods, transaction.paymentMethod), ...stateFor('paymentMethod') },
    ].filter((item) => item.status !== 'confirmed' && item.confidence !== 'high');
    const categoryNeedsReview = summaryBadges.some((item) => item.field === 'category');
    const paymentNeedsReview = summaryBadges.some((item) => item.field === 'paymentMethod');
    const availableCategories = categories.filter((item) => item.isEnable && item.type === (transaction.type === 'income' ? 'income' : 'spend'));

    const confirmField = (field) => {
        if (field === 'date') {
            update({ dateConfidence: 'high', dateStatus: 'confirmed', timeConfidence: 'high', timeStatus: 'confirmed' });
            return;
        }
        update({ [`${field}Confidence`]: 'high', [`${field}Status`]: 'confirmed' });
    };

    const saveInlineEdit = (editedTransaction) => {
        const [date = '', time = transaction.time || '12:00'] = (editedTransaction.date || '').split('T');
        update({
            ...editedTransaction,
            date: date || transaction.date,
            time,
            note: editedTransaction.notes || '',
            paymentMethod: editedTransaction.paymentMethodId || null,
        });
        setIsEditing(false);
    };

    const formConfidence = {
        ...transaction,
        ...(CONFIDENCE_WEIGHT[stateFor('time').confidence] > CONFIDENCE_WEIGHT[stateFor('date').confidence]
            ? { dateConfidence: transaction.timeConfidence, dateStatus: transaction.timeStatus }
            : {}),
    };

    return (
        <article className={styles.reviewCard}>
            {!isEditing && <>
            <div className={styles.reviewRowTop}>
                <span className={styles.transactionNumber}>{index + 1}</span>
                <div className={styles.reviewMainInfo}><span className={styles.reviewType}>{transaction.type === 'income' ? 'Income' : 'Expense'} draft</span></div>
                <div className={styles.reviewActions}>
                    {summaryBadges.map((badge) => {
                        const Icon = badge.confidence === 'low' ? ExclamationCircleFill : ExclamationTriangleFill;
                        const explanation = badge.field === 'date' ? 'Date or time was inferred from your input. Please review it.' : getFieldExplanation(badge.field, badge.confidence);
                        return <button key={badge.field} type="button" className={`${styles.confidenceButton} ${styles[`confidenceButton${badge.confidence}`]}`} aria-label={`${badge.label}: ${explanation}`} title={`${badge.label}: ${explanation}`} onClick={() => setActiveHint(activeHint === badge.field ? null : badge.field)}><Icon size={13} /></button>;
                    })}
                    <button type="button" className={styles.iconButton} aria-label={isEditing ? 'Close editor' : 'Edit transaction'} title={isEditing ? 'Close editor' : 'Review this transaction'} onClick={() => setIsEditing((editing) => !editing)}>{isEditing ? <X size={17} /> : <PencilSquare size={15} />}</button>
                    <button type="button" className={styles.trashButton} onClick={() => onRemove(index)} aria-label="Remove transaction"><Trash3 size={15} /></button>
                </div>
            </div>

            {activeHint && <div className={styles.confidencePopover} role="status">{summaryBadges.find((item) => item.field === activeHint)?.field === 'date' ? 'Date or time was inferred from your input. Please review it.' : getFieldExplanation(activeHint, summaryBadges.find((item) => item.field === activeHint)?.confidence)}</div>}
            <div className={styles.reviewValueGrid}>
                {reviewFields.map((item) => <div className={styles.reviewValue} key={item.field}>
                    <span>{item.label}</span>
                    {item.field === 'category' && categoryNeedsReview
                        ? <select value={transaction.categoryId || ''} onChange={(event) => update({ categoryId: event.target.value || null, categoryConfidence: 'high', categoryStatus: 'confirmed' })}><option value="">Choose category</option>{availableCategories.map((option) => <option key={option.id} value={option.id}>{option.emoji} {option.name}</option>)}</select>
                        : <strong>{item.value}</strong>}
                </div>)}
            </div>
            {paymentNeedsReview && <div className={styles.reviewMetaLine}><select className={styles.quickPaymentSelect} value={transaction.paymentMethod || ''} onChange={(event) => update({ paymentMethod: event.target.value || null, paymentMethodConfidence: 'high', paymentMethodStatus: 'confirmed' })}><option value="">Choose payment method</option>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></div>}
            </>}

            {isEditing && <div className={styles.inlineEditor}>
                <div className={styles.editorToolbar}><span>Editing {transaction.type === 'income' ? 'income' : 'expense'}</span><button type="button" className={styles.iconButton} onClick={() => setIsEditing(false)} aria-label="Close editor"><X size={17} /></button></div>
                <AddExpenseForm
                    inlineQuickAddEdit
                    isEditMode
                    editingTransaction={{ ...transaction, categoryName: category?.name || transaction.categoryName, category: category?.name || transaction.categoryName, categoryIcon: category?.emoji || transaction.categoryIcon || '📦', date: `${transaction.date || ''}T${transaction.time || '12:00'}`, notes: transaction.note || '', paymentMethodId: transaction.paymentMethod || null }}
                    quickAddConfidence={formConfidence}
                    onConfirmQuickAddField={confirmField}
                    onUpdateExpense={saveInlineEdit}
                    onCancelEdit={() => setIsEditing(false)}
                />
            </div>}
        </article>
    );
}

QuickAddReviewCard.propTypes = {
    transaction: PropTypes.object.isRequired, index: PropTypes.number.isRequired, categories: PropTypes.array.isRequired,
    paymentMethods: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired, onRemove: PropTypes.func.isRequired,
};

export default QuickAddReviewCard;
