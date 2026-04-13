import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from 'react-bootstrap-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import DataTable from './DataTable';
import { DEFAULT_CURRENCY_SYMBOL } from '../../../../Util';
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
                    <span className={row.type === 'income' ? 'text-success' : ''}>{currencySymbol}{row.amount.toFixed(0)}</span>
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
                <div className="d-flex align-items-center gap-2 mb-3">
                    <h4 className={`${styles.sectionTitle} mb-0`}>
                        Latest Transactions
                    </h4>
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip id="recent-transactions-info-tooltip">
                                Showing {Math.min(limit, transactions.length)} most recent transactions
                            </Tooltip>
                        }
                    >
                        <InfoCircle
                            size={16}
                            className="text-muted"
                            style={{ cursor: 'help' }}
                        />
                    </OverlayTrigger>
                </div>
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
    currencySymbol: PropTypes.string,
    limit: PropTypes.number
};

RecentTransactionsTab.defaultProps = {
    currencySymbol: DEFAULT_CURRENCY_SYMBOL,
    limit: 50
};

export default RecentTransactionsTab;