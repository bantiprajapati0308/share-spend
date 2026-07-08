import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-bootstrap';
import { ArrowLeft, InfoCircle } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import DatePickerInput from '../../../utils/DatePickerInput';
import PersonNameDropdown from '../../../components/common/PersonNameDropdown';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { applyBorrowLendRepayment } from '../utils/borrowLendFirestore';
import { getInitials } from '../utils/ledgerViewModel';
import styles from '../styles/TransactionForm.module.scss';

function RepaymentForm({ mode, selectedPerson, remainingAmount, onSaved, onCancel }) {
    const [personName, setPersonName] = useState(selectedPerson || '');
    const [amount, setAmount] = useState(remainingAmount ? String(remainingAmount) : '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

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
            toast.success(isReturn ? 'Return recorded' : 'Repayment recorded');
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

            {/* Payment method hidden for now. Keep this block ready for the next UI pass.
            <div className={styles.group}>
                <label>Payment Method</label>
                <div className={styles.paymentMethods}>
                    <button type="button" className={styles.selectedMethod}>Cash</button>
                    <button type="button">UPI</button>
                    <button type="button">Bank</button>
                    <button type="button">+ Other</button>
                </div>
            </div>
            */}

            <div className={styles.group}>
                <label>Notes</label>
                <textarea
                    placeholder="Add any notes about this payment..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                />
            </div>

            <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => handleSubmit(false)}>
                    {saving ? 'Saving...' : copy.partialLabel}
                </button>
                <button type="button" className={styles.secondaryButton} disabled={saving || !remainingAmount} onClick={() => handleSubmit(true)}>
                    {copy.fullLabel}
                </button>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => handleSubmit(false)} disabled={saving}>
                Review
            </button>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
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
