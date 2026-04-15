import { useState, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import TabFilter from '../../../../components/common/TabFilter';
import DueStatusCard from './DueStatusCard';
import ArchiveSection from './ArchiveSection';
import { TRANSACTION_TYPES } from '../../constants/transactionTypes';
import { getCurrencySymbol } from '../../../../Util';
import { toast } from 'react-toastify';
import styles from '../../styles/DueTracking.module.scss';

/**
 * Main Due Tracking Section Component
 * Handles tab filtering, displays due status cards, and manages archive functionality
 *
 * @param {Object} dueTrackingHook - Hook object from useLendingTransactions with due tracking methods
 * @param {string} currency - Currency code (default: 'INR')
 */
function DueTrackingSection({ dueTrackingHook, currency = 'INR' }) {
    const [activeTab, setActiveTab] = useState('receive'); // 'receive' or 'pay'
    const currencySymbol = getCurrencySymbol(currency);

    const {
        getDueTrackingByType,
        getArchivedTransactions,
        archiveTransaction,
        unarchiveTransaction,
        loading
    } = dueTrackingHook;

    // Tab configuration
    const tabs = [
        { id: 'receive', label: 'To Receive' },
        { id: 'pay', label: 'Need to Pay' }
    ];

    // Get transactions based on active tab
    const currentTransactionType = activeTab === 'receive' ? TRANSACTION_TYPES.GAVE : TRANSACTION_TYPES.TOOK;
    const dueData = useMemo(() => {
        return getDueTrackingByType(currentTransactionType);
    }, [getDueTrackingByType, currentTransactionType]);

    // Get archived transactions for current tab
    const archivedTransactions = useMemo(() => {
        return getArchivedTransactions().filter(t => t.type === currentTransactionType);
    }, [getArchivedTransactions, currentTransactionType]);

    const handleArchive = async (uuid) => {
        try {
            await archiveTransaction(uuid);
            toast.success('Transaction archived successfully');
        } catch (error) {
            console.error('Error archiving transaction:', error);
            toast.error('Failed to archive transaction');
        }
    };

    const handleUnarchive = async (uuid) => {
        try {
            await unarchiveTransaction(uuid);
            toast.success('Transaction restored from archive');
        } catch (error) {
            console.error('Error unarchiving transaction:', error);
            toast.error('Failed to restore transaction');
        }
    };

    const hasActiveDues = dueData.upcoming.length > 0 || dueData.overdue.length > 0;
    const hasArchivedTransactions = archivedTransactions.length > 0;

    if (loading) {
        return (
            <div className={styles.dueTrackingSection}>
                <Container fluid>
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading due tracking...</span>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className={styles.dueTrackingSection}>
            <Container fluid>
                {/* Section Header */}
                <Row className="mb-4">
                    <Col>
                        <div className={styles.sectionHeader}>
                            <h4 className={styles.sectionTitle}>Due Tracking</h4>
                            <p className={styles.sectionSubtitle}>
                                Monitor upcoming and overdue transactions
                            </p>
                        </div>
                    </Col>
                </Row>

                {/* Tab Filter */}
                <Row className="mb-4">
                    <Col>
                        <TabFilter
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </Col>
                </Row>

                {/* Due Status Cards */}
                {hasActiveDues ? (
                    <>
                        {/* Overdue Section */}
                        {dueData.overdue.length > 0 && (
                            <Row className="mb-4">
                                <Col>
                                    <div className={styles.statusSection}>
                                        <h6 className={`${styles.statusSectionTitle} ${styles.overdue}`}>
                                            Overdue ({dueData.overdue.length})
                                        </h6>
                                        <Row>
                                            {dueData.overdue.map(transaction => (
                                                <Col key={transaction.uuid} xs={12} sm={6} lg={4}>
                                                    <DueStatusCard
                                                        transaction={transaction}
                                                        currencySymbol={currencySymbol}
                                                        onArchive={handleArchive}
                                                        isArchived={false}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        )}

                        {/* Upcoming Section */}
                        {dueData.upcoming.length > 0 && (
                            <Row className="mb-4">
                                <Col>
                                    <div className={styles.statusSection}>
                                        <h6 className={`${styles.statusSectionTitle} ${styles.upcoming}`}>
                                            Upcoming ({dueData.upcoming.length})
                                        </h6>
                                        <Row>
                                            {dueData.upcoming.map(transaction => (
                                                <Col key={transaction.uuid} xs={12} sm={6} lg={4}>
                                                    <DueStatusCard
                                                        transaction={transaction}
                                                        currencySymbol={currencySymbol}
                                                        onArchive={handleArchive}
                                                        isArchived={false}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </>
                ) : (
                    <Row className="mb-4">
                        <Col>
                            <div className={styles.emptyState}>
                                <div className={styles.emptyStateIcon}>📅</div>
                                <h6 className={styles.emptyStateTitle}>No Due Transactions</h6>
                                <p className={styles.emptyStateText}>
                                    You don't have any {activeTab === 'receive' ? 'receivable' : 'payable'} transactions
                                    with upcoming or overdue dates.
                                </p>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Archive Section */}
                {hasArchivedTransactions && (
                    <ArchiveSection
                        archivedTransactions={archivedTransactions}
                        currencySymbol={currencySymbol}
                        onUnarchive={handleUnarchive}
                        transactionType={activeTab}
                    />
                )}
            </Container>
        </div>
    );
}

export default DueTrackingSection;