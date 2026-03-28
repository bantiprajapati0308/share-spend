import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/BorrowLend.module.scss';
import { getCurrencySymbol } from '../../../Util';

function AddTransactionForm({ onAddTransaction }) {
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('lent');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!personName.trim() || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        const newTransaction = {
            id: Date.now(),
            personName: personName,
            amount: parseFloat(amount),
            type: type,
            date: date,
            description: description,
            createdAt: new Date().toISOString(),
        };

        onAddTransaction(newTransaction);

        // Reset form
        setPersonName('');
        setAmount('');
        setType('lent');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');

        toast.success(`Amount ${type === 'lent' ? 'lent' : 'borrowed'} successfully!`);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formSection}>
            <h3>Add New Transaction</h3>

            <div className={styles.formGroup}>
                <label>Transaction Type *</label>
                <div className={styles.typeToggle}>
                    <div>
                        <input
                            type="radio"
                            id="lent"
                            name="type"
                            value="lent"
                            checked={type === 'lent'}
                            onChange={(e) => setType(e.target.value)}
                        />
                        <label htmlFor="lent" style={{ margin: 0, cursor: 'pointer' }}>
                            I Lent Money
                        </label>
                    </div>
                    <div>
                        <input
                            type="radio"
                            id="borrowed"
                            name="type"
                            value="borrowed"
                            checked={type === 'borrowed'}
                            onChange={(e) => setType(e.target.value)}
                        />
                        <label htmlFor="borrowed" style={{ margin: 0, cursor: 'pointer' }}>
                            I Borrowed Money
                        </label>
                    </div>
                </div>
            </div>

            <Row>
                <Col md={6}>
                    <div className={styles.formGroup}>
                        <label>Person's Name *</label>
                        <input
                            type="text"
                            placeholder="e.g., John Doe"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                        />
                    </div>
                </Col>
                <Col md={6}>
                    <div className={styles.formGroup}>
                        <label>Amount *</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e62d0' }}>
                                {currencySymbol}
                            </span>
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
                    </div>
                </Col>
            </Row>

            <div className={styles.formGroup}>
                <label>Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <div className={styles.formGroup}>
                <label>Description (Optional)</label>
                <textarea
                    placeholder="Add any notes about this transaction..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <button type="submit" className={styles.submitBtn}>
                <Plus size={20} className="me-2" />
                Add Transaction
            </button>
        </form>
    );
}

export default AddTransactionForm;
