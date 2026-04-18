/**
 * BorrowLend Transactions Table
 * Displays aggregated lending/borrowing transactions in separate tables with tab switching
 * Enhanced with beautiful status indicators, due dates, and creative styling
 */

import { useMemo, useState } from 'react';
import ReportTable from '../../../components/report/ReportTable';
import { prepareAggregatedTableData } from '../utils/borrowLendTableUtils';
import { createEnhancedBorrowLendRenderer } from '../utils/borrowLendTableRenderers';
import TransactionDetailsModal from './TransactionDetailsModal';
import PropTypes from 'prop-types';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import styles from '../styles/BorrowLendTable.module.scss';

function BorrowLendTable({ transactions, currency }) {
    const [selectedRow, setSelectedRow] = useState(null);
    const [activeTab, setActiveTab] = useState('gave'); // 'gave' for Lending, 'took' for Borrowing

    // Filter transactions by type
    const lentTransactions = useMemo(() =>
        transactions.filter(t => t.type === TRANSACTION_TYPES.GAVE),
        [transactions]
    );

    const borrowedTransactions = useMemo(() =>
        transactions.filter(t => t.type === TRANSACTION_TYPES.TOOK),
        [transactions]
    );

    // Prepare aggregated data for both types
    const lentAggregatedData = useMemo(() =>
        prepareAggregatedTableData(lentTransactions),
        [lentTransactions]
    );

    const borrowedAggregatedData = useMemo(() =>
        prepareAggregatedTableData(borrowedTransactions),
        [borrowedTransactions]
    );

    // Select the appropriate data based on active tab
    const activeData = activeTab === 'gave' ? lentAggregatedData : borrowedAggregatedData;
    // Create clean professional headers
    const headers = useMemo(() => [
        { label: 'Person', className: 'p-3' },
        { label: 'Amount', className: 'p-3' },
        { label: activeTab === 'gave' ? 'Lent Date' : 'Borrowed Date', className: 'p-3' },
        { label: 'Due Date', className: 'p-3' },
        { label: 'Duration', className: 'p-3 text-center' },
        { label: 'Status', className: 'p-3 text-center' }
    ], [activeTab]);

    // Create enhanced renderer with click handler
    const renderRow = useMemo(() =>
        createEnhancedBorrowLendRenderer(currency, (data, personName, status) => {
            // Only show modal if there are multiple transactions
            if (data && data.length > 1) {
                setSelectedRow({ data, personName, status });
            }
        })
        , [currency]);

    const handleCloseModal = () => setSelectedRow(null);
    // Tab switch handler
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedRow(null); // Close modal when switching tabs
    };

    const isLendingTab = activeTab === 'gave';
    const emptyMessage = isLendingTab
        ? "No 'gave' transactions yet. Start by giving money!"
        : "No 'took' transactions yet. Start by taking money!";

    return (
        <div className={styles.tableContainer}>
            {/* Enhanced Tab Navigation */}
            <div className={styles.tabNavigation}>
                <button
                    onClick={() => handleTabChange('gave')}
                    className={`${styles.tabButton} ${activeTab === 'gave' ? styles.activeGave : ''}`}
                >
                    <span className={styles.tabIcon}>📤</span>
                    <span className={styles.tabLabel}>Gave</span>
                    <span className={styles.tabCount}>({lentTransactions.length})</span>
                </button>
                <button
                    onClick={() => handleTabChange('took')}
                    className={`${styles.tabButton} ${activeTab === 'took' ? styles.activeTook : ''}`}
                >
                    <span className={styles.tabIcon}>📥</span>
                    <span className={styles.tabLabel}>Took</span>
                    <span className={styles.tabCount}>({borrowedTransactions.length})</span>
                </button>
            </div>

            {/* Enhanced Table Content */}
            <div className={styles.tableWrapper}>
                <ReportTable
                    headers={headers}
                    data={activeData}
                    renderRow={renderRow}
                    emptyMessage={emptyMessage}
                />
            </div>

            {/* Transaction Details Modal */}
            {selectedRow && (
                <TransactionDetailsModal
                    show={!!selectedRow}
                    onHide={handleCloseModal}
                    selectedRow={selectedRow}
                    currency={currency}
                />
            )}
        </div>
    );
}

BorrowLendTable.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.object).isRequired,
    currency: PropTypes.string.isRequired,
};

export default BorrowLendTable;
