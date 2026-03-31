import { useState } from 'react';
import PropTypes from 'prop-types';
import { Trash3 } from 'react-bootstrap-icons';
import styles from '../styles/BorrowLend.module.scss';
import { getCurrencySymbol } from '../../../Util';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { getTransactionStatus } from '../constants/transactionTypes';

function TransactionItem({ transaction, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true);
            await onDelete(transaction.id);
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const isOverdue = transaction.dueDate && new Date(transaction.dueDate) < new Date();
    const isDueSoon = transaction.dueDate &&
        new Date(transaction.dueDate) >= new Date() &&
        new Date(transaction.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.transactionItem}>
            <div className={styles.transactionInfo}>
                <div className={styles.transactionName}>
                    {transaction.personName}
                </div>

                <div className={`${styles.transactionType} ${styles[transaction.type]}`}>
                    {getTransactionStatus(transaction.type)}
                </div>

                {transaction.description && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                        {transaction.description}
                    </div>
                )}

                <div className={styles.transactionDates}>
                    <div className={styles.transactionDate}>
                        📅 {formatDate(transaction.date)}
                    </div>

                    {transaction.dueDate && (
                        <div className={`${styles.transactionDueDate} ${isOverdue ? styles.overdue : isDueSoon ? styles.dueSoon : ''}`}>
                            ⏰ Due: {formatDate(transaction.dueDate)}
                            {isOverdue && <span className={styles.overdueLabel}> (Overdue)</span>}
                            {isDueSoon && !isOverdue && <span className={styles.dueSoonLabel}> (Due Soon)</span>}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${styles.transactionAmount} ${styles[transaction.type]}`}>
                {transaction.type === 'gave' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
            </div>

            <button
                className={styles.deleteBtn}
                onClick={handleDeleteClick}
                title="Delete transaction"
            >
                <Trash3 size={18} />
            </button>

            <DeleteConfirmationModal
                show={showDeleteModal}
                transaction={transaction}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteModal(false)}
                isDeleting={isDeleting}
            />
        </div>
    );
}

TransactionItem.propTypes = {
    transaction: PropTypes.shape({
        id: PropTypes.string.isRequired,
        personName: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        type: PropTypes.oneOf(['gave', 'took']).isRequired,
        date: PropTypes.string.isRequired,
        dueDate: PropTypes.string,
        description: PropTypes.string,
        createdAt: PropTypes.any,
    }).isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default TransactionItem;
