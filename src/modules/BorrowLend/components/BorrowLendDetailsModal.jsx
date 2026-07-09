import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { formatLedgerDate, getTransactionLabel } from '../utils/ledgerViewModel';
import styles from '../styles/BorrowLendDetailsModal.module.scss';

function BorrowLendDetailsModal({ transaction, show, onHide, formatAmount }) {
    if (!transaction) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Transaction Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className={styles.detailsList}>
                    <div><span>Person</span><strong>{transaction.personName}</strong></div>
                    <div><span>Type</span><strong>{getTransactionLabel(transaction)}</strong></div>
                    <div><span>Amount</span><strong>{formatAmount(transaction.amount)}</strong></div>
                    <div><span>Date</span><strong>{formatLedgerDate(transaction.date)}</strong></div>
                    <div><span>Due Date</span><strong>{formatLedgerDate(transaction.dueDate)}</strong></div>
                    {transaction.description && (
                        <div><span>Notes</span><strong>{transaction.description}</strong></div>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
}

BorrowLendDetailsModal.propTypes = {
    transaction: PropTypes.object,
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    formatAmount: PropTypes.func.isRequired,
};

BorrowLendDetailsModal.defaultProps = {
    transaction: null,
};

export default BorrowLendDetailsModal;
