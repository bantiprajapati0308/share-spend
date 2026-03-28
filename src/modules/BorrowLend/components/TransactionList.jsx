import React from 'react';
import styles from '../styles/BorrowLend.module.scss';
import TransactionItem from './TransactionItem';

function TransactionList({ transactions, filterType, onFilterChange, onDelete }) {
    return (
        <div className={styles.transactionList}>
            <h3>Transaction History</h3>

            {transactions.length > 0 && (
                <div className={styles.filterTabs}>
                    <button
                        className={filterType === 'all' ? styles.active : ''}
                        onClick={() => onFilterChange('all')}
                    >
                        All Transactions ({transactions.length})
                    </button>
                    <button
                        className={filterType === 'lent' ? styles.active : ''}
                        onClick={() => onFilterChange('lent')}
                    >
                        Lent ({transactions.filter(t => t.type === 'lent').length})
                    </button>
                    <button
                        className={filterType === 'borrowed' ? styles.active : ''}
                        onClick={() => onFilterChange('borrowed')}
                    >
                        Borrowed ({transactions.filter(t => t.type === 'borrowed').length})
                    </button>
                </div>
            )}

            {transactions.length === 0 ? (
                <div className={styles.noTransactions}>
                    <p>No transactions yet. Start tracking your lending and borrowing above!</p>
                </div>
            ) : (
                <>
                    {transactions.map((transaction) => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            onDelete={onDelete}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

export default TransactionList;
