import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    ArrowLeft,
    ArrowUpRight,
    Bell,
    ChevronDown,
    ChevronRight,
    FileEarmarkPdf,
    Pencil,
    PencilSquare,
    ShieldCheck,
    Envelope,
    Telephone,
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
import { exportPersonLedgerPdf } from '../utils/exportPersonLedgerPdf';
import styles from '../styles/PersonLedger.module.scss';

function PersonLedger({
    person,
    transactions,
    formatAmount,
    onBack,
    onRecordReturn,
    onWhatsAppReminder,
    onUpdateContact,
    onEdit,
    onView,
    onDelete,
}) {
    const [showContactDetails, setShowContactDetails] = useState(false);
    const isLending = person.type === TRANSACTION_TYPES.GAVE;
    const canSendReminder = isLending && person.remaining > 0;
    const totalBase = isLending ? person.totalLent : person.totalBorrowed;
    const hasMobileNumber = Boolean(person.mobileNumber);
    const hasEmail = Boolean(person.email);
    const formatMobileNumber = (value) => {
        const digits = String(value || '').replace(/\D/g, '');
        const localNumber = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        if (localNumber.length !== 10) return value;
        return `+91 ${localNumber.slice(0, 5)} ${localNumber.slice(5)}`;
    };
    const handleExportPdf = async () => {
        try {
            await exportPersonLedgerPdf({ person, transactions, formatAmount });
        } catch (error) {
            console.error('Ledger PDF export failed:', error);
        }
    };

    return (
        <div className={styles.screen}>
            <header className={styles.header}>
                <button type="button" aria-label="Back" onClick={onBack} className={styles.iconButton}>
                    <ArrowLeft size={17} />
                </button>
                <h1>{person.personName}</h1>
                <button type="button" className={styles.exportButton} onClick={handleExportPdf}>
                    <span>PDF</span>
                    <FileEarmarkPdf size={16} />
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

                <div className={styles.heroBottom}>
                    <div className={styles.heroAmountBlock}>
                        <strong className={person.remaining === 0 ? styles.settledAmount : ''}>
                            {formatAmount(person.remaining)}
                        </strong>
                        <p>{person.remaining === 0 ? 'Settled' : `Due on ${formatLedgerDate(person.dueDate)}`}</p>
                    </div>

                    {canSendReminder && (
                        <button type="button" className={styles.heroReminderButton} onClick={onWhatsAppReminder}>
                            <span className={styles.reminderIcon}>
                                <Bell size={16} />
                            </span>
                            <span className={styles.reminderCopy}>
                                <strong>Set Reminder</strong>
                                <small>Remind on due date</small>
                            </span>
                            <ChevronRight size={17} />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    className={styles.contactToggle}
                    onClick={() => setShowContactDetails((current) => !current)}
                    aria-expanded={showContactDetails}
                >
                    <span>
                        <strong>{showContactDetails ? 'Hide contact details' : 'Show contact details'}</strong>
                        <small>{hasMobileNumber || hasEmail ? 'Mobile number & email' : 'Add mobile number or email'}</small>
                    </span>
                    <ChevronDown className={showContactDetails ? styles.contactToggleIconOpen : ''} size={16} />
                </button>

                {showContactDetails && (
                    <div className={styles.contactRows}>
                        <button type="button" className={styles.contactRow} onClick={onUpdateContact}>
                            <span className={`${styles.contactRowIcon} ${styles.phoneIcon}`}>
                                <Telephone size={20} />
                            </span>
                            <span className={styles.contactRowCopy}>
                                <small>Mobile Number</small>
                                <strong className={!hasMobileNumber ? styles.addText : ''}>
                                    {hasMobileNumber ? formatMobileNumber(person.mobileNumber) : 'Add contact number'}
                                </strong>
                            </span>
                            <span className={styles.contactRowAction}>
                                <PencilSquare size={15} />
                                {hasMobileNumber ? 'Edit' : 'Add'}
                                <ChevronRight size={16} />
                            </span>
                        </button>

                        <button type="button" className={styles.contactRow} onClick={onUpdateContact}>
                            <span className={`${styles.contactRowIcon} ${styles.emailIcon}`}>
                                <Envelope size={20} />
                            </span>
                            <span className={styles.contactRowCopy}>
                                <small>Email Address</small>
                                <strong className={!hasEmail ? styles.addText : ''}>
                                    {hasEmail ? person.email : 'Add email address'}
                                </strong>
                            </span>
                            <span className={styles.contactRowAction}>
                                <PencilSquare size={15} />
                                {hasEmail ? 'Edit' : 'Add'}
                                <ChevronRight size={16} />
                            </span>
                        </button>
                    </div>
                )}
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
                                            {transaction.dueDate && (
                                                <span className={styles.transactionDueDate}>
                                                    Due: {formatLedgerDate(transaction.dueDate)}
                                                </span>
                                            )}
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
    onUpdateContact: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default PersonLedger;
