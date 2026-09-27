import { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Spinner } from 'react-bootstrap';
import { ArrowLeft, InfoCircle, Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/TransactionForm.module.scss';
import DatePickerInput from '../../../utils/DatePickerInput';
import { TRANSACTION_TYPES, getTransactionTypeLabel } from '../constants/transactionTypes';
import PersonNameDropdown from '../../../components/common/PersonNameDropdown';
import { primeBorrowLendPersonContact, primeBorrowLendPersonName } from '../hooks/useBorrowLendPersonNames';
import { DAILY_SPEND_SYNC_CHOICES } from '../utils/dailySpendSync';

function AddTransactionForm({ onAddTransaction, initialType = TRANSACTION_TYPES.GAVE, contactPeople = [], onCancel = null }) {
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [dailySpendSyncChoice, setDailySpendSyncChoice] = useState('');
    const [dailySpendSyncError, setDailySpendSyncError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const type = initialType;

    const actionInfo = type === TRANSACTION_TYPES.GAVE
        ? {
            title: 'Lend Money',
            description: 'Use this when you give money to someone and expect them to return it later.',
            tone: styles.lendInfo,
        }
        : {
            title: 'Borrow Money',
            description: 'Use this when you receive money from someone and you need to repay it later.',
            tone: styles.borrowInfo,
        };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!personName.trim() || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!dailySpendSyncChoice) {
            const message = 'Please choose whether you want to add this transaction to your Daily Spend records.';
            setDailySpendSyncError(message);
            toast.error(message);
            return;
        }

        if (dueDate && new Date(dueDate) < new Date(date)) {
            toast.error('Due date cannot be before transaction date');
            return;
        }

        const trimmedPersonName = personName.trim();
        const newTransaction = {
            personName: trimmedPersonName,
            amount: parseFloat(amount),
            type: type,
            date: date,
            dueDate: dueDate || null,
            description: description,
            mobileNumber,
            email,
            syncToDailySpend: dailySpendSyncChoice === DAILY_SPEND_SYNC_CHOICES.YES,
            createdAt: new Date().toISOString(),
        };

        try {
            setIsSubmitting(true);
            await onAddTransaction(newTransaction);
            primeBorrowLendPersonName(type, trimmedPersonName);
            primeBorrowLendPersonContact(type, {
                personName: trimmedPersonName,
                mobileNumber,
                email,
                type,
            });

            setPersonName('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setDueDate('');
            setDescription('');
            setMobileNumber('');
            setEmail('');
            setDailySpendSyncChoice('');
            setDailySpendSyncError('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const findKnownPersonContact = (name) => {
        const normalizedName = String(name || '').trim().toLowerCase();
        if (!normalizedName) return null;

        return contactPeople.find((person) =>
            person.type === type &&
            String(person.personName || '').trim().toLowerCase() === normalizedName
        ) || null;
    };

    const applyPersonContact = (name, selectedPerson = null) => {
        const knownPerson = findKnownPersonContact(name);
        const source = selectedPerson?.mobileNumber || selectedPerson?.email
            ? selectedPerson
            : knownPerson;

        setMobileNumber(source?.mobileNumber || '');
        setEmail(source?.email || '');
    };

    const handlePersonNameChange = (nextName) => {
        setPersonName(nextName);
        applyPersonContact(nextName);
    };

    const handleSelectPerson = (person) => {
        applyPersonContact(person?.personName || personName, person);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
                <button type="button" className={styles.ghostButton} onClick={onCancel} aria-label="Close form">
                    <ArrowLeft size={17} />
                </button>
                <h3>Add {getTransactionTypeLabel(type).replace(' Money', '')}</h3>
                <span>1/2</span>
            </div>

            <section className={`${styles.actionInfoCard} ${actionInfo.tone}`}>
                <div className={styles.infoIcon}>
                    <InfoCircle size={18} />
                </div>
                <div>
                    <strong>{actionInfo.title}</strong>
                    <p>{actionInfo.description}</p>
                </div>
            </section>

            <Row className="mt-3">
                <Col xs={12}>
                    <div className={styles.group}>
                        <label>To Whom? *</label>
                        <PersonNameDropdown
                            value={personName}
                            onChange={handlePersonNameChange}
                            onSelectPerson={handleSelectPerson}
                            placeholder="Person name"
                            type={type}
                        />
                    </div>
                </Col>
                <Col xs={12}>
                    <div className={styles.group}>
                        <label>Amount *</label>
                        <div className={styles.amountInput}>
                            <span>₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <label>Mobile No. (Optional)</label>
                        <input
                            type="tel"
                            placeholder="Enter mobile number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            inputMode="tel"
                        />
                    </div>
                </Col>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <label>Email ID (Optional)</label>
                        <input
                            type="email"
                            placeholder="Enter email id"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <DatePickerInput
                            label="Date"
                            value={date}
                            onChange={(val) => val && setDate(val)}
                            maxDate={new Date().toISOString().split('T')[0]}
                            placeholder="Select date"
                        />
                    </div>
                </Col>
                <Col xs={12} md={6}>
                    <div className={styles.group}>
                        <DatePickerInput
                            label="Due Date (Optional)"
                            value={dueDate}
                            onChange={setDueDate}
                            minDate={date}
                            isClearable
                            placeholder="Select due date"
                        />
                    </div>
                </Col>
            </Row>

            <div className={styles.group}>
                <label>Notes (Optional)</label>
                <textarea
                    placeholder="Add a note..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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

            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Spinner animation="border" size="sm" />
                        Adding Transaction...
                    </>
                ) : (
                    <>
                        <Plus size={17} />
                        Add Transaction
                    </>
                )}
            </button>
            {onCancel && (
                <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </button>
            )}
        </form>
    );
}

AddTransactionForm.propTypes = {
    onAddTransaction: PropTypes.func.isRequired,
    initialType: PropTypes.oneOf(Object.values(TRANSACTION_TYPES)),
    contactPeople: PropTypes.arrayOf(PropTypes.shape({
        personName: PropTypes.string,
        mobileNumber: PropTypes.string,
        email: PropTypes.string,
        type: PropTypes.string,
    })),
    onCancel: PropTypes.func,
};

export default AddTransactionForm;
