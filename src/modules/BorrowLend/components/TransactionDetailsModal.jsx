/**
 * Transaction Details View
 * Shows individual transactions that were grouped into an aggregated row
 */

import { Modal } from 'react-bootstrap';
import { formatTransactionDate } from '../utils/borrowLendTableUtils';
import styles from '../styles/BorrowLend.module.scss';
import PropTypes from 'prop-types';
import { tableIcon } from '../utils/borrowLendTableRenderers';


function TransactionDetailsModal({ show, onHide, selectedRow }) {
    const { data, personName, status } = selectedRow;
    console.log(data, "data")
    if (!data || data.length === 0) {
        return null;
    }

    const statusColors = {
        'Partially Paid': '#e6cb35', // Green for lending
        'Pending': '#f48b36'  // Red for borrowing
    };
    const individualStatusColor = {
        'repayment': '#3deb4c',
        'lent': '#4a90e2',
        'borrowed pay': '#3deb4c',
        'borrowed': '#4a90e2'
    }
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {personName} <span style={{ backgroundColor: statusColors[status] }} className={styles.modalStatus}>{status}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {data.map((transaction, idx) => {
                        const transactionStatus = transaction.payment_type.toLowerCase()
                        return (
                            <div
                                key={transaction.id || idx}
                                style={{
                                    padding: '12px',
                                    marginBottom: '8px',
                                    borderLeft: `4px solid ${individualStatusColor[transactionStatus] || '#ccc'}`,
                                    backgroundColor: '#f0f4ff',
                                    borderRadius: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: `${individualStatusColor[transactionStatus] || '#ccc'}` }}>
                                        {(transaction.amount || 0).toFixed(2)}<span style={{ marginLeft: '0.5rem' }}>{tableIcon(transactionStatus)}</span>
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {formatTransactionDate(new Date(transaction.insert_date))}
                                    </span>
                                </div>
                                {transaction.due_date
                                    && (
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>
                                            Due: {formatTransactionDate(new Date(transaction.due_date))}
                                        </div>
                                    )}
                                {transaction.description && (
                                    <div style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                                        {transaction.description}
                                    </div>
                                )}
                            </div>)
                    }
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div style={{ textAlign: 'right', width: '100%' }}>
                    <strong>Total: {data.reduce((sum, t) => sum + ((t.payment_type.toLowerCase() === 'lent' || t.payment_type.toLowerCase() === 'borrowed') ? t.amount : -t.amount), 0).toFixed(2)}</strong>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

TransactionDetailsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    personName: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.object),
    currency: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
};

export default TransactionDetailsModal;
