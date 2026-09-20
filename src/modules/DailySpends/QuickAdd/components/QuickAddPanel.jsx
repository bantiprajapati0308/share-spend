import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Magic, Send, XCircleFill } from 'react-bootstrap-icons';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { quickAddApi } from '../../../../services/api/quickAddApi';
import { parseFailed, parseStarted, parseSucceeded, removeQuickTransaction, resetQuickAdd, setPrompt, updateQuickTransaction } from '../../../../redux/quickAddSlice';
import { categoryForId, transactionPayload } from '../quickAddUtils';
import QuickAddReview from './QuickAddReview';
import styles from '../QuickAdd.module.scss';

const examples = ['Spent ₹200 on fuel and ₹90 on snacks', 'Paid ₹1,200 for dinner with UPI', 'Bought groceries for ₹500 and fuel for ₹200 in cash'];

function QuickAddPanel({ categories, onAddTransactionsBulk }) {
    const dispatch = useDispatch();
    const { prompt, status, transactions, warnings, error } = useSelector((state) => state.quickAdd);
    const paymentMethods = useSelector((state) => state.appConfig.paymentMethods);
    const [saving, setSaving] = useState(false);
    const parseRequestId = useRef(0);

    const parsePrompt = async () => {
        if (!prompt.trim()) return toast.error('Describe one or more transactions first');
        const requestId = ++parseRequestId.current;
        dispatch(parseStarted());
        const response = await quickAddApi.parse(prompt.trim());
        if (requestId !== parseRequestId.current) return;
        if (!response.success) {
            dispatch(parseFailed(response.error));
            return;
        }
        dispatch(parseSucceeded(response.data));
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
            <div className={styles.quickAddHeader}><div><span className={styles.quickAddEyebrow}><Magic size={14} /> AI assisted</span><h3>Add transactions with AI</h3><p>Describe your spending in any language. Review, then save.</p></div>{status !== 'idle' && <button type="button" className={styles.clearButton} onClick={() => { parseRequestId.current += 1; dispatch(resetQuickAdd()); }}>Cancel</button>}</div>
            {status !== 'review' && <>
                <div className={styles.promptBox}><textarea value={prompt} onChange={(event) => dispatch(setPrompt(event.target.value))} placeholder="Tell us your transactions in any language — AI will organize them for you." rows="2" /><button type="button" disabled={status === 'loading'} onClick={parsePrompt} aria-label="Analyze transactions"><Send size={19} /></button></div>
                <div className={styles.examples}>{examples.map((example) => <button type="button" key={example} onClick={() => dispatch(setPrompt(example))}>{example}</button>)}</div>
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
