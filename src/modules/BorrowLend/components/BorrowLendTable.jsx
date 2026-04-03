/**
 * BorrowLend Transactions Table
 * Displays aggregated lending/borrowing transactions in separate tables with tab switching
 */

import { useMemo, useState } from 'react';
import ReportTable from '../../../components/report/ReportTable';
import { prepareAggregatedTableData } from '../utils/borrowLendTableUtils';
import { createBorrowLendTableRenderer } from '../utils/borrowLendTableRenderers';
import TransactionDetailsModal from './TransactionDetailsModal';
import PropTypes from 'prop-types';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

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

    // Create headers
    const headers = useMemo(() => [
        { label: 'Name', className: 'p-2' },
        { label: 'Amount', className: 'p-2' },
        { label: activeTab === 'gave' ? 'Lending Date' : 'Borrowed Date', className: 'p-2' },
        { label: 'Due Date', className: 'p-2' },
        { label: 'Total Days', className: 'p-2 text-center' },
        { label: 'Status', className: 'p-2 text-center' }
    ], [activeTab]);

    // Create renderer with click handler
    const renderRow = useMemo(() =>
        createBorrowLendTableRenderer(currency, (data, personName, status) => {
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
        ? "No lending transactions yet. Start by lending money!"
        : "No borrowed transactions yet. Start by borrowing money!";

    return (
        <>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e0e0e0' }}>
                <button
                    onClick={() => handleTabChange('gave')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'gave' ? '600' : '500',
                        color: activeTab === 'gave' ? '#1565c0' : '#999',
                        borderBottom: activeTab === 'gave' ? '3px solid #1565c0' : 'none',
                        transition: 'all 0.3s ease',
                        marginBottom: '-2px'
                    }}
                >
                    Lending ({lentTransactions.length})
                </button>
                <button
                    onClick={() => handleTabChange('took')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'took' ? '600' : '500',
                        color: activeTab === 'took' ? '#c62828' : '#999',
                        borderBottom: activeTab === 'took' ? '3px solid #c62828' : 'none',
                        transition: 'all 0.3s ease',
                        marginBottom: '-2px'
                    }}
                >
                    Borrowing ({borrowedTransactions.length})
                </button>
            </div>

            {/* Table Content */}
            <ReportTable
                headers={headers}
                data={activeData}
                renderRow={renderRow}
                emptyMessage={emptyMessage}
            />

            {/* Transaction Details Modal */}
            {selectedRow && (
                <TransactionDetailsModal
                    show={!!selectedRow}
                    onHide={handleCloseModal}
                    selectedRow={selectedRow}
                />
            )}
        </>
    );
}

BorrowLendTable.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.object).isRequired,
    currency: PropTypes.string.isRequired,
};

export default BorrowLendTable;
