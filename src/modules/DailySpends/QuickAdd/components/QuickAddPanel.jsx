import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Cart3, ChevronRight, CupHotFill, FuelPumpFill, ForkKnife, Magic, XCircleFill } from 'react-bootstrap-icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { quickAddApi } from '../../../../services/api/quickAddApi';
import { parseFailed, parseStarted, parseSucceeded, removeQuickTransaction, resetQuickAdd, setPrompt, updateQuickTransaction } from '../../../../redux/quickAddSlice';
import AIInputComposer from '../../../../components/common/AIInputComposer';
import { categoryForId, transactionPayload } from '../quickAddUtils';
import QuickAddReview from './QuickAddReview';
import styles from '../QuickAdd.module.scss';

const examples = [
    { text: 'Spent ₹200 on fuel and ₹90 on snacks', icon: FuelPumpFill, tone: 'fuel' },
    { text: 'Bought groceries for ₹500 in cash', icon: Cart3, tone: 'groceries' },
    { text: 'Paid ₹1,200 for dinner with UPI', icon: ForkKnife, tone: 'dining' },
    { text: 'Coffee ₹150 at CCD', icon: CupHotFill, tone: 'coffee' },
    { text: 'Paid ₹800 for electricity bill online', icon: Magic, tone: 'bills' },
    { text: 'Received ₹5,000 from a friend', icon: Magic, tone: 'income' },
];

function QuickAddPanel({ categories, onAddTransactionsBulk }) {
    const dispatch = useDispatch();
    const { prompt, status, transactions, warnings, error } = useSelector((state) => state.quickAdd);
    const paymentMethods = useSelector((state) => state.appConfig.paymentMethods);
    const [saving, setSaving] = useState(false);
    const [showMoreExamples, setShowMoreExamples] = useState(false);
    const [composerResetKey, setComposerResetKey] = useState(0);
    const parseRequestId = useRef(0);

    const parsePrompt = async ({ text, image }) => {
        if (!text && !image) return toast.error('Describe a transaction or attach a receipt image first');
        const requestId = ++parseRequestId.current;
        dispatch(parseStarted());
        const response = await quickAddApi.parse(text, image);
        if (requestId !== parseRequestId.current) return;
        if (!response.success) {
            dispatch(parseFailed(response.error));
            return;
        }
        dispatch(parseSucceeded(response.data));
    };

    const clearDraft = () => {
        parseRequestId.current += 1;
        setComposerResetKey((key) => key + 1);
        dispatch(resetQuickAdd());
    };

    const updateTransaction = (index, changes) => dispatch(updateQuickTransaction({ index, changes }));

    const saveTransactions = async () => {
        const unresolvedLow = transactions.some((transaction) => {
            if (transaction.categoryConfidence === 'low' && transaction.categoryStatus !== 'confirmed') return true;
            if (transaction.paymentMethodConfidence === 'low' && transaction.paymentMethodStatus !== 'confirmed') return true;
            if (transaction.amountConfidence === 'low' && transaction.amountStatus !== 'confirmed') return true;
            if (transaction.nameConfidence === 'low' && transaction.nameStatus !== 'confirmed') return true;
            return false;
        });

        if (unresolvedLow) {
            toast.error('Please resolve the fields marked in red before saving.');
            return;
        }

        const incomplete = transactions.find((transaction) => !transaction.name || !Number(transaction.amount) || !transaction.categoryId || !transaction.paymentMethod);
        if (incomplete) return toast.error('Select a category and payment method, and check the name and amount before saving.');

        setSaving(true);
        try {
            const payloads = transactions.map((transaction) => transactionPayload(transaction, categoryForId(categories, transaction.categoryId)));
            await onAddTransactionsBulk(payloads);
            toast.success(`${transactions.length} transaction${transactions.length === 1 ? '' : 's'} saved successfully`);
            dispatch(resetQuickAdd());
        } catch (saveError) {
            toast.error(saveError.message || 'Could not save transactions');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={styles.quickAddPanel}>
            <div className={styles.quickAddHeader}><div><span className={styles.quickAddEyebrow}><Magic size={14} /> AI assisted</span><h3>Add transactions with AI</h3><p>Describe your spending in any language. Review, then save.</p></div>{status !== 'idle' && <button type="button" className={styles.clearButton} onClick={clearDraft}>Cancel</button>}</div>
            {status !== 'review' && <>
                <AIInputComposer
                    key={composerResetKey}
                    resetKey={composerResetKey}
                    value={prompt}
                    onChange={(value) => dispatch(setPrompt(value))}
                    onSubmit={parsePrompt}
                    placeholder="What did you spend on?"
                    busy={status === 'loading'}
                />
                <div className={styles.examplesHeading}><span>☀️ Try these examples</span><button type="button" onClick={() => setShowMoreExamples((showing) => !showing)} aria-expanded={showMoreExamples}>{showMoreExamples ? 'See less' : 'See more'} <ChevronRight size={13} className={showMoreExamples ? styles.chevronExpanded : ''} /></button></div>
                <div className={styles.examples}>{examples.slice(0, showMoreExamples ? examples.length : 4).map(({ text, icon: ExampleIcon, tone }) => <button type="button" key={text} className={styles[`example${tone}`]} onClick={() => dispatch(setPrompt(text))}><ExampleIcon size={18} /><span>{text}</span></button>)}</div>
                {status === 'loading' && <div className={styles.processing}><span className={styles.processingOrb} /><div><strong>Analyzing your input…</strong><small>Finding transactions, categories, dates and payment methods.</small></div></div>}
                {status === 'error' && <div className={styles.parseError}><XCircleFill size={17} /> {error || 'Unable to analyze this input. Please try again.'}</div>}
            </>}
            {status === 'review' && (
                <QuickAddReview
                    transactions={transactions}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    warnings={warnings}
                    onChange={updateTransaction}
                    onRemove={(index) => dispatch(removeQuickTransaction(index))}
                    onSave={saveTransactions}
                    saving={saving}
                />
            )}
        </section>
    );
}

QuickAddPanel.propTypes = {
    categories: PropTypes.array.isRequired,
    onAddTransactionsBulk: PropTypes.func.isRequired,
};
export default QuickAddPanel;
