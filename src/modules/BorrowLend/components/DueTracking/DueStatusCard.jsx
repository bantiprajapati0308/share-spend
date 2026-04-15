import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import { Archive, ArrowCounterclockwise } from 'react-bootstrap-icons';
import { getCurrencySymbol } from '../../../../Util';
import { getDueStatus, formatDueDate } from '../../utils/dueDateUtils';
import styles from '../../styles/DueStatusCard.module.scss';

/**
 * Reusable Due Status Card Component
 * Displays individual transaction with due status, amount, and archive functionality
 *
 * @param {Object} transaction - Transaction object
 * @param {string} currencySymbol - Currency symbol to display
 * @param {function} onArchive - Callback when archive button is clicked
 * @param {function} onUnarchive - Callback when unarchive button is clicked
 * @param {boolean} isArchived - Whether this card is in archived state
 */
function DueStatusCard({
    transaction,
    currencySymbol = '₹',
    onArchive,
    onUnarchive,
    isArchived = false
}) {
    const dueStatus = getDueStatus(transaction.dueDate);
    const displayAmount = Math.abs(transaction.amount || 0);

    // Determine card status class based on due status
    const getStatusClass = () => {
        if (isArchived) return styles.archived;

        switch (dueStatus.status) {
            case 'overdue':
                return styles.overdue;
            case 'upcoming':
                return styles.upcoming;
            default:
                return styles.onTime;
        }
    };

    const handleArchiveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isArchived && onUnarchive) {
            onUnarchive(transaction.uuid);
        } else if (!isArchived && onArchive) {
            onArchive(transaction.uuid);
        }
    };

    return (
        <Card className={`${styles.dueCard} ${getStatusClass()}`}>
            <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start">
                    <div className={styles.cardContent}>
                        {/* Person Name & Amount Row */}
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className={`${styles.personName} mb-0`}>
                                {transaction.personName}
                            </h6>
                            <div className={styles.amount}>
                                {currencySymbol}{displayAmount.toLocaleString('en-IN')}
                            </div>
                        </div>

                        {/* Due Status */}
                        {!isArchived && transaction.dueDate && (
                            <div className={`d-flex justify-content-between align-items-center mb-1`}>
                                <div className={`${styles.dueDateText} text-muted`}>
                                    <small>Due: {formatDueDate(transaction.dueDate)}</small>
                                </div>
                                <small className={styles.statusText}>
                                    {dueStatus.displayText}
                                </small>
                            </div>
                        )}

                        {/* Archive status */}
                        {isArchived && (
                            <div className={styles.archivedInfo}>
                                <small className="text-muted">
                                    Archived {transaction.archivedAt ?
                                        new Date(transaction.archivedAt).toLocaleDateString() :
                                        'recently'
                                    }
                                </small>
                            </div>
                        )}

                        {/* Description (if exists) */}
                        {transaction.description && (
                            <div className={`${styles.description} text-muted mb-1`}>
                                <small>{transaction.description}</small>
                            </div>
                        )}

                        {/* Transaction Type Badge */}
                        <div className='d-flex justify-content-between align-items-center'>
                            <div className={`${styles.typeIndicator} mt-1`}>
                                <span className={`${styles.typeBadge} ${transaction.type === 'gave' ? styles.receivable : styles.payable}`}>
                                    {transaction.type === 'gave' ? 'To Receive' : 'To Pay'}
                                </span>
                            </div>
                            <button
                                className={`${styles.archiveButton} btn align-self-start mt-1`}
                                onClick={handleArchiveClick}
                                title={isArchived ? 'Restore from archive' : 'Archive transaction'}
                                type="button"
                            >
                                {isArchived ? (
                                    <ArrowCounterclockwise size={14} />
                                ) : (
                                    <Archive size={14} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Archive Button */}
                </div>
            </Card.Body>
        </Card>
    );
}

DueStatusCard.propTypes = {
    transaction: PropTypes.shape({
        uuid: PropTypes.string.isRequired,
        personName: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        dueDate: PropTypes.string,
        description: PropTypes.string,
        type: PropTypes.oneOf(['gave', 'took']).isRequired,
        archived: PropTypes.bool,
        archivedAt: PropTypes.string,
    }).isRequired,
    currencySymbol: PropTypes.string,
    onArchive: PropTypes.func,
    onUnarchive: PropTypes.func,
    isArchived: PropTypes.bool,
};

export default DueStatusCard;