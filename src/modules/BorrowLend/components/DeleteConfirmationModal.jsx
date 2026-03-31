
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { getCurrencySymbol } from '../../../Util';

function DeleteConfirmationModal({ show, transaction, onConfirm, onCancel, isDeleting }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    if (!transaction) return null;

    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Transaction</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    Are you sure you want to delete this transaction with{' '}
                    <strong>{transaction.personName}</strong> for{' '}
                    <strong>
                        {currencySymbol}
                        {transaction.amount.toFixed(2)}
                    </strong>
                    ?
                </p>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '1rem' }}>
                    This action cannot be undone.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

DeleteConfirmationModal.propTypes = {
    show: PropTypes.bool.isRequired,
    transaction: PropTypes.shape({
        id: PropTypes.string.isRequired,
        personName: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        type: PropTypes.oneOf(['gave', 'took']).isRequired,
        date: PropTypes.string.isRequired,
        dueDate: PropTypes.string,
        description: PropTypes.string,
        createdAt: PropTypes.any,
    }),
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isDeleting: PropTypes.bool,
};

DeleteConfirmationModal.defaultProps = {
    transaction: null,
    isDeleting: false,
};

export default DeleteConfirmationModal;
