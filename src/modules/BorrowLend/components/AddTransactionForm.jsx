import { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/BorrowLend.module.scss';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import { TRANSACTION_TYPES, getTransactionTypeLabel } from '../constants/transactionTypes';

function AddTransactionForm({ onAddTransaction }) {
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState(TRANSACTION_TYPES.GAVE);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!personName.trim() || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (dueDate && new Date(dueDate) < new Date(date)) {
            toast.error('Due date cannot be before transaction date');
            return;
        }

        const newTransaction = {
            personName: personName,
            amount: parseFloat(amount),
            type: type,
            date: date,
            dueDate: dueDate || null,
            description: description,
            createdAt: new Date().toISOString(),
        };

        onAddTransaction(newTransaction);

        setPersonName('');
        setAmount('');
        setType(TRANSACTION_TYPES.GAVE);
        setDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.formHeader}>
                <h3>Add {getTransactionTypeLabel(type)}</h3>
                <TransactionTypeSelector
                    value={type}
                    onChange={setType}
                    showLabel={false}
                />
            </div>

            <Row className="mt-3">
                <Col xs={7} md={6}>
                    <div className={styles.formGroup} >
                        <label>{'Person\'s Name *'}</label>
                        <input
                            type="text"
                            placeholder="e.g., John Doe"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                        />
                    </div>
                </Col>
                <Col xs={5} md={6}>
                    <div className={styles.formGroup}>
                        <label>Amount *</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            style={{ flex: 1 }}
                        />
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={6} md={6}>
                    <div className={styles.formGroup}>
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </Col>
                <Col xs={6} md={6}>
                    <div className={styles.formGroup}>
                        <label>Due Date (Optional)</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={date}
                        />
                    </div>
                </Col>
            </Row>

            <div className={styles.formGroup}>
                <label>Description (Optional)</label>
                <textarea
                    placeholder="Add any notes about this transaction..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <button type="submit" className={styles.submitBtn}>
                <Plus size={20} className="me-2" />
                Add Transaction
            </button>
        </form>
    );
}

AddTransactionForm.propTypes = {
    onAddTransaction: PropTypes.func.isRequired,
};

export default AddTransactionForm;
