import React from 'react';
import { Trash3 } from 'react-bootstrap-icons';
import styles from '../styles/BorrowLend.module.scss';
import { getCurrencySymbol } from '../../../Util';

function TransactionItem({ transaction, onDelete }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className={styles.transactionItem}>
            <div className={styles.transactionInfo}>
                <div className={styles.transactionName}>
                    {transaction.personName}
                </div>
                <div className={`${styles.transactionType} ${styles[transaction.type]}`}>
                    {transaction.type === 'lent' ? '✓ Lent' : '↓ Borrowed'}
                </div>
                {transaction.description && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                        {transaction.description}
                    </div>
                )}
                <div className={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            </div>
            <div className={`${styles.transactionAmount} ${styles[transaction.type]}`}>
                {transaction.type === 'lent' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
            </div>
            <button
                className={styles.deleteBtn}
                onClick={() => onDelete(transaction.id)}
                title="Delete transaction"
            >
                <Trash3 size={18} />
            </button>
        </div>
    );
}

export default TransactionItem;
