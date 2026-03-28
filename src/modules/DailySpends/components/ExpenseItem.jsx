import React from 'react';
import { Trash3 } from 'react-bootstrap-icons';
import styles from '../styles/DailySpends.module.scss';
import { getCurrencySymbol } from '../../../Util';

function ExpenseItem({ expense, onDelete }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    const getCategoryIcon = (category) => {
        const icons = {
            'Food': '🍔',
            'Transport': '🚗',
            'Entertainment': '🎬',
            'Shopping': '🛍️',
            'Utilities': '💡',
            'Health': '🏥',
            'Other': '📝'
        };
        return icons[category] || '📝';
    };

    return (
        <div className={styles.expenseItem}>
            <div className={styles.expenseInfo}>
                <div className={styles.expenseName}>
                    {getCategoryIcon(expense.category)} {expense.name}
                </div>
                <div className={styles.expenseCategory}>
                    {expense.category}
                </div>
                {expense.notes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                        {expense.notes}
                    </div>
                )}
                <div className={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            </div>
            <div className={styles.expenseAmount}>
                {currencySymbol}{expense.amount.toFixed(2)}
            </div>
            <button
                className={styles.deleteBtn}
                onClick={() => onDelete(expense.id)}
                title="Delete expense"
            >
                <Trash3 size={18} />
            </button>
        </div>
    );
}

export default ExpenseItem;
