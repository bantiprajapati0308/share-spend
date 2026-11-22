import { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircleFill, InfoCircle } from 'react-bootstrap-icons';
import QuickAddReviewCard from './QuickAddReviewCard';
import { getReviewSaveState } from '../quickAddUtils';
import styles from '../QuickAdd.module.scss';

function QuickAddReview({ transactions, categories, paymentMethods, warnings, onChange, onRemove, onSave, saving }) {
    const needsReview = transactions.some((item) => ['categoryConfidence', 'amountConfidence', 'nameConfidence', 'dateConfidence', 'timeConfidence', 'paymentMethodConfidence'].some((key) => item[key] === 'low' || item[key] === 'medium'));
    const saveState = getReviewSaveState(transactions);
    const reviewMessages = [
        ...(needsReview ? ['Please review the highlighted fields before saving. AI suggestions can be wrong.'] : []),
        ...(saveState.message ? [saveState.message] : []),
        ...warnings,
    ];
    const total = transactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const [showReviewMessages, setShowReviewMessages] = useState(false);

    return (
        <section className={styles.reviewSection} aria-live="polite">
            <div className={styles.reviewHeading}>
                <div><span className={styles.foundPill}><CheckCircleFill size={14} /> {transactions.length} draft{transactions.length === 1 ? '' : 's'} ready</span><h4>Check details, then save</h4></div>
                {reviewMessages.length > 0 && <span className={`${styles.reviewInfoWrap} ${showReviewMessages ? styles.reviewInfoTooltipOpen : ''}`}>
                    <button
                        type="button"
                        className={styles.reviewInfoButton}
                        aria-label="View review messages"
                        aria-describedby="quick-add-review-messages"
                        aria-expanded={showReviewMessages}
                        onClick={() => setShowReviewMessages((visible) => !visible)}
                    >
                        <InfoCircle size={18} />
                    </button>
                    <span id="quick-add-review-messages" className={styles.reviewInfoTooltip} role="tooltip">
                        {reviewMessages.map((message, index) => <span key={`${message}-${index}`}>{message}</span>)}
                    </span>
                </span>}
            </div>
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
