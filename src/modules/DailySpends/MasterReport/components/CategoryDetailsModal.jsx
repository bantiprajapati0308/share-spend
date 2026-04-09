import React from 'react';
import { Modal, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';

/**
 * Professional Category Details Modal Component  
 * Clean, banking-style display of individual transactions for a specific category
 */
function CategoryDetailsModal({
    show,
    onHide,
    categoryName,
    transactions,
    currencySymbol = '₹'
}) {
    if (!transactions || transactions.length === 0) {
        return null;
    }
    console.log(transactions, "transactions in modal");
    // Calculate statistics for the category
    const totalAmount = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    // Format currency consistently
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        return `${currencySymbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format date consistently with better styling
    const formatDate = (date) => {
        const dateObj = new Date(date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const year = dateObj.getFullYear();
        return { day, month, year };
    };

    // Sort transactions by date (most recent first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
    });

    return (
        <Modal show={show} onHide={onHide} size="md" centered className={styles.categoryModal}>
            {/* Mobile Banking Style Header */}
            <Modal.Header closeButton className="border-bottom-0 pb-2">
                <Modal.Title className={`${styles.modalTitle} w-100`}>
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center gap-3">
                            <div className={styles.categoryIcon}>
                                <div className="outline rounded-circle p-2 text-white d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                    <span style={{ fontSize: '18px' }}>
                                        {transactions[0].categoryIcon}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <h6 className="mb-0 fw-semibold text-dark">{categoryName}</h6>
                                    <Badge bg="primary" className="rounded-pill">
                                        {transactions.length}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="h4 fw-bold text-success mb-0" style={{ fontSize: '22px', color: '#28a745 !important' }}>
                                {formatCurrency(totalAmount)}
                            </div>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>


            {/* Transactions Label */}
            <div className="px-3 pb-2">
                <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-0 fw-semibold text-dark">Transactions</h6>
                    <small className="text-muted">All Time</small>
                </div>
            </div>

            {/* Transaction List - Mobile Banking Style */}
            <Modal.Body className={`${styles.modalBody} p-0`}>
                <div className={styles.transactionsList}>
                    {sortedTransactions.map((transaction, idx) => {
                        const dateInfo = formatDate(transaction.date || transaction.createdAt);
                        const amount = parseFloat(transaction.amount) || 0;
                        const isToday = new Date(transaction.date || transaction.createdAt).toDateString() === new Date().toDateString();
                        const isYesterday = new Date(transaction.date || transaction.createdAt).toDateString() === new Date(Date.now() - 86400000).toDateString();

                        let dateDisplay = `${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`;
                        if (isToday) dateDisplay = "Today";
                        if (isYesterday) dateDisplay = "Yesterday";

                        return (
                            <div
                                key={transaction.id || idx}
                                className={`${styles.transactionItem} px-3 py-3 border-bottom`}
                            >
                                <div className="d-flex align-items-center">
                                    {/* Brand/Category Icon */}
                                    <div className={`${styles.brandIcon} me-3`}>
                                        <div className="bg-light rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            <span className="text-muted fw-bold" style={{ fontSize: '12px' }}>
                                                {(transaction.description || transaction.name || categoryName).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Transaction Details */}
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold text-dark mb-1" style={{ fontSize: '15px' }}>
                                            {transaction.description || transaction.name || 'Transaction'}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 small text-muted">
                                            <span>{dateDisplay}</span>
                                        </div>
                                        <div className="small text-secondary mt-1">
                                            <span>{transaction.notes ?? '-'}</span>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-end ms-3">
                                        <div className="fw-bold text-danger" style={{ fontSize: '16px', fontWeight: '700' }}>
                                            {formatCurrency(amount)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal.Body>
        </Modal>
    );
}

CategoryDetailsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    categoryName: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        createdAt: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        description: PropTypes.string,
        name: PropTypes.string,
        notes: PropTypes.string,
        remarks: PropTypes.string,
        category: PropTypes.string
    })).isRequired,
    currencySymbol: PropTypes.string
};

CategoryDetailsModal.defaultProps = {
    currencySymbol: '₹'
};

export default CategoryDetailsModal;