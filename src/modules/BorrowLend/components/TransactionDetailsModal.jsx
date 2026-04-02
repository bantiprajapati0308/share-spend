/**
 * Transaction Details View
 * Shows individual transactions that were grouped into an aggregated row
 */

import { Modal } from 'react-bootstrap';
import { getCurrencySymbol } from '../../../Util';
import { formatTransactionDate } from '../utils/borrowLendTableUtils';
import PropTypes from 'prop-types';

function TransactionDetailsModal({ show, onHide, personName, transactions, currency, type }) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    const statusLabel = type === 'gave' ? 'Lent' : 'Borrowed';

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {personName} - {statusLabel} Transactions
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {transactions.map((transaction, idx) => (
                        <div
                            key={transaction.id || idx}
                            style={{
                                padding: '12px',
                                marginBottom: '8px',
                                borderLeft: '4px solid #1565c0',
                                backgroundColor: '#f0f4ff',
                                borderRadius: '4px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, color: '#1565c0' }}>
                                    {getCurrencySymbol(currency)}{(transaction.amount || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                    {formatTransactionDate(new Date(transaction.date))}
                                </span>
                            </div>
                            {transaction.dueDate && (
                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>
                                    Due: {formatTransactionDate(new Date(transaction.dueDate))}
                                </div>
                            )}
                            {transaction.description && (
                                <div style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                                    {transaction.description}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div style={{ textAlign: 'right', width: '100%' }}>
                    <strong>Total: {getCurrencySymbol(currency)}{transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}</strong>
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
