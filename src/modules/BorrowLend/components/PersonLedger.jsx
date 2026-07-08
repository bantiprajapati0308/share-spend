import PropTypes from 'prop-types';
import {
    ArrowLeft,
    ArrowUpRight,
    Bell,
    FileEarmarkSpreadsheet,
    Pencil,
    ShieldCheck,
} from 'react-bootstrap-icons';
import StatusBadge from './StatusBadge';
import TransactionActionsMenu from './TransactionActionsMenu';
import {
    formatLedgerDate,
    formatShortDateParts,
    getInitials,
    getTransactionLabel,
    isRepaymentPayment,
} from '../utils/ledgerViewModel';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { exportPersonLedgerExcel } from '../utils/exportPersonLedgerExcel';
import styles from '../styles/PersonLedger.module.scss';

function PersonLedger({
    person,
    transactions,
    formatAmount,
    onBack,
    onRecordReturn,
    onWhatsAppReminder,
    onEdit,
    onView,
    onDelete,
}) {
    const isLending = person.type === TRANSACTION_TYPES.GAVE;
    const totalBase = isLending ? person.totalLent : person.totalBorrowed;
    const handleExportExcel = () => {
        try {
            exportPersonLedgerExcel({ person, transactions, formatAmount });
        } catch (error) {
            console.error('Ledger Excel export failed:', error);
        }
    };

    return (
        <div className={styles.screen}>
            <header className={styles.header}>
                <button type="button" aria-label="Back" onClick={onBack} className={styles.iconButton}>
                    <ArrowLeft size={17} />
                </button>
                <h1>{person.personName}</h1>
                <button type="button" className={styles.exportButton} onClick={handleExportExcel}>
                    <span>Export</span>
                    <FileEarmarkSpreadsheet size={16} />
                </button>
            </header>

            <section className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <span className={styles.avatar}>{getInitials(person.personName)}</span>
                    <div>
                        <small>{isLending ? 'You lent money' : 'You borrowed money'}</small>
                        <h2>{person.personName}</h2>
                    </div>
                    <StatusBadge status={person.status} />
                </div>
                <strong className={person.remaining === 0 ? styles.settledAmount : ''}>
                    {formatAmount(person.remaining)}
                </strong>
                <p>{person.remaining === 0 ? 'Settled' : `Due on ${formatLedgerDate(person.dueDate)}`}</p>
            </section>

            <section className={styles.summaryChips}>
                <div>
                    <span>{isLending ? 'Total Lent' : 'Total Borrowed'}</span>
                    <strong>{formatAmount(totalBase)}</strong>
                </div>
                <div>
                    <span>Returned</span>
                    <strong>{formatAmount(person.totalReturned)}</strong>
                </div>
                <div>
                    <span>Remaining</span>
                    <strong className={styles.danger}>{formatAmount(person.remaining)}</strong>
                </div>
            </section>

            <section className={styles.tabs}>
                <button type="button" className={styles.activeTab}>History</button>
                <button type="button">Details</button>
            </section>

            <section className={styles.history}>
                {transactions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ShieldCheck size={34} />
                        <h3>Start by adding your first transaction.</h3>
                    </div>
                ) : (
                    transactions.map((transaction) => {
                        const repayment = isRepaymentPayment(transaction.paymentType);
                        const dateParts = formatShortDateParts(transaction.date);
                        const balanceText = transaction.balanceAfter === 0
                            ? 'Balance: cleared'
                            : `Balance: ${formatAmount(transaction.balanceAfter)} due`;

                        return (
                            <article
                                key={transaction.id}
                                className={`${styles.historyCard} ${repayment ? styles.returned : styles.lent}`}
                            >
                                <div className={styles.datePill}>
                                    <strong>{dateParts.day}</strong>
                                    <span>{dateParts.month}</span>
                                </div>
                                <div className={styles.historyBody}>
                                    <div className={styles.historyTop}>
                                        <div>
                                            <h3>{getTransactionLabel(transaction)}</h3>
                                            <p>{transaction.description || (repayment ? 'Partial payment' : 'Cash given')}</p>
                                        </div>
                                        <strong className={repayment ? styles.negative : styles.positive}>
                                            {repayment ? '-' : '+'} {formatAmount(transaction.amount)}
                                        </strong>
                                    </div>
                                    <div className={styles.balanceRow}>
                                        <span>{balanceText}</span>
                                        <TransactionActionsMenu
                                            transaction={transaction}
                                            onEdit={onEdit}
                                            onView={onView}
                                            onDelete={onDelete}
                                        />
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>

            {person.remaining > 0 && (
                <button type="button" className={styles.reminderCard} onClick={onWhatsAppReminder}>
                    <span>
                        Due on {formatLedgerDate(person.dueDate)}
                        <strong>{formatAmount(person.remaining)}</strong>
                    </span>
                    <span><Bell size={13} /> WhatsApp Reminder</span>
                </button>
            )}

            <nav className={styles.actionDock}>
                <button type="button">
                    <ArrowUpRight size={17} />
                    Lend
                </button>
                <button type="button" className={styles.activeAction} onClick={onRecordReturn}>
                    <ShieldCheck size={17} />
                    Return
                </button>
                <button type="button" onClick={() => onEdit({ personName: person.personName })}>
                    <Pencil size={17} />
                    Edit
                </button>
                <button type="button">⋯ More</button>
            </nav>
        </div>
    );
}

PersonLedger.propTypes = {
    person: PropTypes.object.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.object).isRequired,
    formatAmount: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    onRecordReturn: PropTypes.func.isRequired,
    onWhatsAppReminder: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default PersonLedger;
