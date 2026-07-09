import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Col, Row, Spinner } from 'react-bootstrap';
import { ArrowLeft, InfoCircle, Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import DatePickerInput from '../../../utils/DatePickerInput';
import PersonNameDropdown from '../../../components/common/PersonNameDropdown';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { applyBorrowLendRepayment } from '../utils/borrowLendFirestore';
import {
    addBorrowLendTransactionToDailySpend,
    DAILY_SPEND_SYNC_CHOICES,
    getBorrowLendDailySpendKind,
} from '../utils/dailySpendSync';
import { getInitials } from '../utils/ledgerViewModel';
import styles from '../styles/TransactionForm.module.scss';

function RepaymentForm({ mode, selectedPerson, remainingAmount, onSaved, onCancel }) {
    const [personName, setPersonName] = useState(selectedPerson || '');
    const [amount, setAmount] = useState(remainingAmount ? String(remainingAmount) : '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [dailySpendSyncChoice, setDailySpendSyncChoice] = useState('');
    const [dailySpendSyncError, setDailySpendSyncError] = useState('');

    const isReturn = mode === 'return';
    const recordType = isReturn ? TRANSACTION_TYPES.GAVE : TRANSACTION_TYPES.TOOK;

    const copy = useMemo(() => ({
        title: isReturn ? 'Record Return' : 'Record Repay',
        helper: isReturn
            ? 'Use this when someone returns money you lent.'
            : 'Use this when you repay money you borrowed.',
        infoTitle: isReturn ? 'Money Returned' : 'Money Repaid',
        infoDescription: isReturn
            ? 'Use this when someone pays back money that you previously lent to them.'
            : 'Use this when you pay back money that you previously borrowed from someone.',
        infoTone: isReturn ? styles.returnInfo : styles.repayInfo,
        amountLabel: isReturn ? 'Return Amount *' : 'Repay Amount *',
        fullLabel: isReturn ? 'Full Return' : 'Full Settlement',
        partialLabel: isReturn ? 'Partial Return' : 'Partial Repay',
    }), [isReturn]);

    const handleSubmit = async (settleFull = false) => {
        if (!personName.trim() || !amount) {
            toast.error('Please fill in person and amount');
            return;
        }

        if (!dailySpendSyncChoice) {
            const message = 'Please choose whether you want to add this transaction to your Daily Spend records.';
            setDailySpendSyncError(message);
            toast.error(message);
            return;
        }

        const repaymentAmount = settleFull && remainingAmount ? remainingAmount : parseFloat(amount);
        if (!repaymentAmount || repaymentAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setSaving(true);
            const savedRepayment = await applyBorrowLendRepayment({
                personName: personName.trim(),
                repaymentAmount,
                date,
                description,
                type: recordType,
            });
            let dailySpendSynced = false;
            if (dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.YES) {
                try {
                    await addBorrowLendTransactionToDailySpend({
                        kind: getBorrowLendDailySpendKind({ mode }),
                        personName: personName.trim(),
                        amount: repaymentAmount,
                        date,
                        description,
                    });
                    dailySpendSynced = true;
                } catch (syncError) {
                    console.error('Daily Spend sync failed:', syncError);
                    toast.warning(`${isReturn ? 'Return' : 'Repayment'} saved in Borrow/Lend, but could not be added to Daily Spend.`);
                }
            }

            toast.success(dailySpendSynced
                ? `${isReturn ? 'Return' : 'Repayment'} recorded in Borrow/Lend and Daily Spend`
                : `${isReturn ? 'Return' : 'Repayment'} recorded`);
            onSaved({
                ...savedRepayment,
                personName: personName.trim(),
                repaymentAmount,
                amount: repaymentAmount,
                type: recordType,
            });
        } catch (error) {
            console.error('Repayment error:', error);
            toast.error('Failed to save repayment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.form}>
            <div className={styles.formHeader}>
                <button type="button" className={styles.ghostButton} onClick={onCancel} aria-label="Close form">
                    <ArrowLeft size={17} />
                </button>
                <h3>{copy.title}</h3>
                <span>1/2</span>
            </div>

            <section className={`${styles.actionInfoCard} ${copy.infoTone}`}>
                <div className={styles.infoIcon}>
                    <InfoCircle size={18} />
                </div>
                <div>
                    <strong>{copy.infoTitle}</strong>
                    <p>{copy.infoDescription}</p>
                </div>
            </section>

            <section className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                    <span className={styles.avatar}>{getInitials(personName)}</span>
                    <div>
                        <strong>{personName || 'Select person'}</strong>
                        <span>{copy.helper}</span>
                    </div>
                </div>
                <div className={styles.summaryGrid}>
                    <div>
                        <span>{isReturn ? 'Total Lent' : 'Total Borrowed'}</span>
                        <strong>₹{Number(remainingAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                        <span>Returned</span>
                        <strong>₹0</strong>
                    </div>
                    <div>
                        <span>Remaining</span>
                        <strong className={styles.danger}>₹{Number(remainingAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                </div>
            </section>

            <Row>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <label>Person *</label>
                        <PersonNameDropdown
                            value={personName}
                            onChange={setPersonName}
                            placeholder="Person name..."
                            type={recordType}
                        />
                    </div>
                </Col>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <label>{copy.amountLabel}</label>
                        <div className={styles.amountInput}>
                            <span>₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            <div className={styles.group}>
                <DatePickerInput
                    label={isReturn ? 'Return Date' : 'Repay Date'}
                    value={date}
                    onChange={(val) => val && setDate(val)}
                    maxDate={new Date().toISOString().split('T')[0]}
                    placeholder="Select date"
                />
            </div>

            <div className={styles.group}>
                <label>Notes</label>
                <textarea
                    placeholder="Add any notes about this payment..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                />
            </div>

            <section className={styles.syncChoiceCard}>
                <h4>Do you want to add this transaction to your Daily Spend records?</h4>
                <label className={dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.YES ? styles.selectedSyncOption : ''}>
                    <input
                        type="radio"
                        name="dailySpendSync"
                        value={DAILY_SPEND_SYNC_CHOICES.YES}
                        checked={dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.YES}
                        onChange={(event) => {
                            setDailySpendSyncChoice(event.target.value);
                            setDailySpendSyncError('');
                        }}
                    />
                    <span>Yes, add to Daily Spend</span>
                </label>
                <label className={dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.NO ? styles.selectedSyncOption : ''}>
                    <input
                        type="radio"
                        name="dailySpendSync"
                        value={DAILY_SPEND_SYNC_CHOICES.NO}
                        checked={dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.NO}
                        onChange={(event) => {
                            setDailySpendSyncChoice(event.target.value);
                            setDailySpendSyncError('');
                        }}
                    />
                    <span>No, only save in Borrow/Lend</span>
                </label>
                {dailySpendSyncError && <p>{dailySpendSyncError}</p>}
            </section>

            <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => handleSubmit(false)}>
                    {saving ? 'Saving...' : copy.partialLabel}
                </button>
                <button type="button" className={styles.secondaryButton} disabled={saving || !remainingAmount} onClick={() => handleSubmit(true)}>
                    {copy.fullLabel}
                </button>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => handleSubmit(false)} disabled={saving}>
                {saving ? (
                    <>
                        <Spinner animation="border" size="sm" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Plus size={17} />
                        Add Transaction
                    </>
                )}
            </button>
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
        </div>
    );
}

RepaymentForm.propTypes = {
    mode: PropTypes.oneOf(['return', 'repay']).isRequired,
    selectedPerson: PropTypes.string,
    remainingAmount: PropTypes.number,
    onSaved: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

RepaymentForm.defaultProps = {
    selectedPerson: '',
    remainingAmount: 0,
};

export default RepaymentForm;
