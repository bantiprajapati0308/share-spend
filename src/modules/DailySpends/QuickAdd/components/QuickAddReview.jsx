import PropTypes from 'prop-types';
import { CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import QuickAddReviewCard from './QuickAddReviewCard';
import { getReviewSaveState } from '../quickAddUtils';
import styles from '../QuickAdd.module.scss';

function QuickAddReview({ transactions, categories, paymentMethods, warnings, onChange, onRemove, onSave, saving }) {
    const needsReview = transactions.some((item) => ['categoryConfidence', 'dateConfidence', 'timeConfidence', 'paymentMethodConfidence'].some((key) => item[key] === 'low' || item[key] === 'medium'));
    const total = transactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const saveState = getReviewSaveState(transactions);

    return (
        <section className={styles.reviewSection} aria-live="polite">
            <div className={styles.reviewHeading}><div><span className={styles.foundPill}><CheckCircleFill size={14} /> {transactions.length} draft{transactions.length === 1 ? '' : 's'} ready</span><h4>Check details, then save</h4></div></div>
            {(needsReview || warnings.length > 0) && <div className={styles.reviewAlert}><ExclamationTriangleFill size={18} /><span>Please review the highlighted fields before saving. AI suggestions can be wrong.</span></div>}
            {warnings.map((warning) => <div className={styles.serverWarning} key={warning}>{warning}</div>)}
            <div className={styles.reviewList}>{transactions.map((transaction, index) => (
                <QuickAddReviewCard
                    key={`${transaction.name}-${index}`}
                    transaction={transaction}
                    index={index}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onChange={onChange}
                    onRemove={onRemove}
                />
            ))}</div>
            {saveState.message && <div className={styles.reviewHelperText}>{saveState.message}</div>}
            <div className={styles.reviewFooter}><div><span>Total amount</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><button type="button" className={styles.saveButton} disabled={saving || !transactions.length || saveState.disabled} onClick={onSave}>{saving ? 'Saving…' : `Save ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`}</button></div>
        </section>
    );
}

QuickAddReview.propTypes = {
    transactions: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
    paymentMethods: PropTypes.array.isRequired,
    warnings: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    saving: PropTypes.bool.isRequired,
};
export default QuickAddReview;
