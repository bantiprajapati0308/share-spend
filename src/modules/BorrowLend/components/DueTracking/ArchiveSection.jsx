import PropTypes from 'prop-types';
import { Row, Col, Collapse } from 'react-bootstrap';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import DueStatusCard from './DueStatusCard';
import styles from '../../styles/ArchiveSection.module.scss';

/**
 * Archive Section Component
 * Displays archived transactions in a collapsible section at the bottom
 *
 * @param {Array} archivedTransactions - Array of archived transaction objects
 * @param {string} currencySymbol - Currency symbol to display
 * @param {function} onUnarchive - Callback when unarchive button is clicked
 * @param {string} transactionType - Current transaction type filter ('receive' or 'pay')
 */
function ArchiveSection({
    archivedTransactions,
    currencySymbol,
    onUnarchive,
    transactionType
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!archivedTransactions || archivedTransactions.length === 0) {
        return null;
    }

    const handleToggleArchive = () => {
        setIsExpanded(!isExpanded);
    };

    const archivedCount = archivedTransactions.length;
    const typeLabel = transactionType === 'receive' ? 'receivable' : 'payable';

    return (
        <div className={styles.archiveSection}>
            {/* Archive Header - Clickable to expand/collapse */}
            <div
                className={styles.archiveHeader}
                onClick={handleToggleArchive}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleToggleArchive();
                    }
                }}
            >
                <div className={styles.headerContent}>
                    <div className={styles.headerText}>
                        <h6 className={styles.archiveTitle}>
                            📦 Archived Transactions
                        </h6>
                        <small className={styles.archiveSubtitle}>
                            {archivedCount} archived {typeLabel} transaction{archivedCount !== 1 ? 's' : ''}
                        </small>
                    </div>
                    <div className={styles.toggleIcon}>
                        {isExpanded ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </div>
                </div>
            </div>

            {/* Archive Content - Collapsible */}
            <Collapse in={isExpanded}>
                <div className={styles.archiveContent}>
                    <Row>
                        {archivedTransactions.map(transaction => (
                            <Col key={transaction.uuid} xs={12} sm={6} lg={4}>
                                <DueStatusCard
                                    transaction={transaction}
                                    currencySymbol={currencySymbol}
                                    onUnarchive={onUnarchive}
                                    isArchived={true}
                                />
                            </Col>
                        ))}
                    </Row>

                    {/* Archive Info */}
                    <div className={styles.archiveInfo}>
                        <small className="text-muted">
                            💡 <strong>Tip:</strong> Click the restore icon on any card to move it back to active transactions.
                        </small>
                    </div>
                </div>
            </Collapse>
        </div>
    );
}

ArchiveSection.propTypes = {
    archivedTransactions: PropTypes.arrayOf(
        PropTypes.shape({
            uuid: PropTypes.string.isRequired,
            personName: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
            type: PropTypes.oneOf(['gave', 'took']).isRequired,
            archived: PropTypes.bool,
            archivedAt: PropTypes.string,
        })
    ).isRequired,
    currencySymbol: PropTypes.string.isRequired,
    onUnarchive: PropTypes.func.isRequired,
    transactionType: PropTypes.oneOf(['receive', 'pay']).isRequired,
};

export default ArchiveSection;