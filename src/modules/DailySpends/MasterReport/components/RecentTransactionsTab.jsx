import React from 'react';
import PropTypes from 'prop-types';
import DataTable from './DataTable';
import styles from '../styles/MasterReport.module.scss';

/**
 * Recent Transactions Tab Component
 * Displays latest transactions with proper formatting
 */
function RecentTransactionsTab({
    transactions,
    currencySymbol,
    limit = 50
}) {
    // Prepare data for the table (limit to recent transactions)
    const recentTransactions = transactions.slice(0, limit).map((tx, index) => ({
        key: tx.id || index,
        date: tx.date || tx.createdAt,
        category: tx.category || 'N/A',
        description: tx.description || tx.name || '-',
        amount: parseFloat(tx.amount) || 0,
        type: tx.type || 'spend',
        rawTransaction: tx
    }));

    // Define table columns
    const columns = [
        {
            key: 'date',
            header: 'Date',
            render: (row) => (
                <span className={styles.dateCell}>
                    {new Date(row.date).toLocaleDateString()}
                </span>
            )
        },
        {
            key: 'category',
            header: 'Category',
            render: (row) => row.category
        },
        {
            key: 'description',
            header: 'Description',
            render: (row) => (
                <span className={styles.description}>
                    {row.description}
                </span>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            render: (row) => (
                <strong className={row.type === 'income' ? styles.income : ''}>
                    {row.type === 'income' ? '+' : ''}
                    {currencySymbol}{row.amount.toFixed(2)}
                </strong>
            )
        },
        {
            key: 'type',
            header: 'Type',
            render: (row) => (
                <span className={`${styles.badge} ${styles[row.type]}`}>
                    {row.type}
                </span>
            )
        }
    ];

    return (
        <div className={styles.tabContent}>
            <div className={styles.tableWrapper}>
                <h4 className={styles.sectionTitle}>
                    Latest Transactions
                </h4>
                <p className={styles.sectionSubtitle}>
                    Showing {Math.min(limit, transactions.length)} most recent transactions
                </p>
                <DataTable
                    columns={columns}
                    data={recentTransactions}
                    className={styles.transactionsTable}
                />
            </div>
        </div>
    );
}

RecentTransactionsTab.propTypes = {
    transactions: PropTypes.array.isRequired,
    currencySymbol: PropTypes.string.isRequired,
    limit: PropTypes.number
};

export default RecentTransactionsTab;