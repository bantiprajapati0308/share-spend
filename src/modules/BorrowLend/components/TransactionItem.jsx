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
        <>
            <div className={`card ${styles.transactionCard}`}>
                <div className="card-body p-2">
                    <div className="row g-2 align-items-center">
                        {/* Person info section - Mobile optimized */}
                        <div className="col-12 col-md-8">
                            <div className="d-flex align-items-center mb-2">
                                <div className={`${styles.personAvatar} me-2`}>
                                    {transaction.personName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                                        <h6 className="mb-0 fw-bold text-dark fs-6">{transaction.personName}</h6>
                                        <span className={`badge ${styles.transactionBadge} ${styles[transaction.type]} ms-2`}>
                                            {getTransactionStatus(transaction.type)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {transaction.description && (
                                <div className={`${styles.transactionDescription} mb-2`}>
                                    <i className="bi bi-chat-text me-1"></i>
                                    <span className="small">{transaction.description}</span>
                                </div>
                            )}

                            <div className="d-flex justify-content-between align-items-center flex-wrap">
                                <div >
                                    <div className={styles.dateInfo}>
                                        <i className="bi bi-calendar3 me-1"></i>
                                        <span>{formatDate(transaction.date)}</span>
                                    </div>
                                </div>
                                {transaction.dueDate && (
                                    <div>
                                        <div className={`${styles.dueDateInfo} ${isOverdue ? styles.overdue : isDueSoon ? styles.dueSoon : styles.normal
                                            }`}>
                                            <i className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill' :
                                                isDueSoon ? 'bi-clock-fill' : 'bi-clock'
                                                } me-1`}></i>
                                            <span>Due: {formatDate(transaction.dueDate)}</span>
                                            {isOverdue && <span className={styles.overdueText}> !</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount and actions - Mobile optimized */}
                        <div className="col-12 col-md-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className={`${styles.amountDisplay} ${styles[transaction.type]}`}>
                                    <div className={styles.amountValue}>
                                        {transaction.type === 'gave' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                                    </div>
                                    <div className={styles.amountLabel}>
                                        {transaction.type === 'gave' ? 'YOU LENT' : 'YOU BORROWED'}
                                    </div>
                                </div>

                                <div className={styles.deleteButtonWrapper}>
                                    <button
                                        className={`${styles.deleteButton} ${isDeleting ? styles.deleting : ''}`}
                                        onClick={handleDeleteClick}
                                        title="Delete transaction"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }}></i>
                                        ) : (
                                            <Trash3 size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                show={showDeleteModal}
                transaction={transaction}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteModal(false)}
                isDeleting={isDeleting}
            />
        </>
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
