import { useMemo, useState } from 'react';
import { Col, Container, Modal, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useLendingTransactions } from './hooks/useLendingTransactions';
import AddTransactionForm from './components/AddTransactionForm';
import BorrowLendDashboard from './components/BorrowLendDashboard';
import BorrowLendDetailsModal from './components/BorrowLendDetailsModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import FloatingActionMenu from './components/FloatingActionMenu';
import PersonLedger from './components/PersonLedger';
import RepaymentForm from './components/RepaymentForm';
import WhatsAppReminderModal from './components/WhatsAppReminderModal';
import FullScreenLoader from '../../components/common/FullScreenLoader';
import { getCurrencySymbol } from '../../Util';
import { addBorrowLendRecord } from './utils/borrowLendFirestore';
import { TRANSACTION_TYPES } from './constants/transactionTypes';
import { buildPeopleLedger, buildPersonTimeline } from './utils/ledgerViewModel';
import { borrowLendApi } from '../../services/api/borrowLendApi';
import { buildWhatsAppReminderMessage, openWhatsAppChat } from './utils/whatsappHelper';
import styles from './styles/BorrowLend.module.scss';

function BorrowLend() {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [formState, setFormState] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [transactionDetails, setTransactionDetails] = useState(null);
    const [whatsAppPerson, setWhatsAppPerson] = useState(null);
    const [whatsAppError, setWhatsAppError] = useState('');
    const [isSavingWhatsAppNumber, setIsSavingWhatsAppNumber] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);
    const lendingHook = useLendingTransactions();

    const {
        transactions,
        expandedTransactions,
        deleteTransaction,
        getTotalGiven,
        getTotalTaken,
        loading,
        error,
        refreshTransactions,
    } = lendingHook;

    const people = useMemo(() => buildPeopleLedger(transactions), [transactions]);
    const selectedTransactions = useMemo(
        () => buildPersonTimeline(expandedTransactions, selectedPerson),
        [expandedTransactions, selectedPerson]
    );

    const formatAmount = (amount) => `${currencySymbol}${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

    const closeForm = () => setFormState(null);

    const openAction = (kind) => {
        if (kind === 'lend') setFormState({ kind: 'add', type: TRANSACTION_TYPES.GAVE });
        if (kind === 'borrow') setFormState({ kind: 'add', type: TRANSACTION_TYPES.TOOK });
        if (kind === 'return') setFormState({
            kind: 'return',
            selectedPersonId: selectedPerson?.id || '',
            selectedPerson: selectedPerson?.personName || '',
            remainingAmount: selectedPerson?.remaining || 0,
            mobileNumber: selectedPerson?.mobileNumber || '',
            email: selectedPerson?.email || '',
            dueDate: selectedPerson?.dueDate || null,
        });
        if (kind === 'repay') setFormState({
            kind: 'repay',
            selectedPersonId: selectedPerson?.id || '',
            selectedPerson: selectedPerson?.personName || '',
            remainingAmount: selectedPerson?.remaining || 0,
            mobileNumber: selectedPerson?.mobileNumber || '',
            email: selectedPerson?.email || '',
            dueDate: selectedPerson?.dueDate || null,
        });
    };

    const handleAddTransaction = async (newTransaction) => {
        try {
            const savedRecord = await addBorrowLendRecord(newTransaction);
            closeForm();
            await refreshTransactions();
            toast.success('Transaction added successfully');
            setWhatsAppError('');
            setWhatsAppPerson({
                id: savedRecord?.id || savedRecord?.entry?.id || '',
                personName: newTransaction.personName,
                mobileNumber: newTransaction.mobileNumber || '',
                email: newTransaction.email || '',
                remaining: Number(newTransaction.amount || 0),
                dueDate: newTransaction.dueDate || null,
                whatsAppContext: newTransaction.type === TRANSACTION_TYPES.TOOK ? 'new-took' : 'new-gave',
            });
        } catch (err) {
            console.error('Error adding transaction:', err);
            toast.error('Failed to add transaction');
        }
    };

    const handleSavedRepayment = async (savedRepayment = {}) => {
        const currentFormState = formState || {};
        closeForm();
        await refreshTransactions();
        setWhatsAppError('');
        setWhatsAppPerson({
            id: savedRepayment.id || savedRepayment.entry?.id || currentFormState.selectedPersonId || '',
            personName: savedRepayment.personName || currentFormState.selectedPerson || '',
            mobileNumber: currentFormState.mobileNumber || '',
            email: currentFormState.email || '',
            remaining: Number(savedRepayment.amount || savedRepayment.repaymentAmount || 0),
            dueDate: currentFormState.dueDate || null,
            whatsAppContext: currentFormState.kind === 'repay' ? 'repay' : 'return',
        });
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            setIsDeleting(true);
            await deleteTransaction(transactionToDelete.uuid || transactionToDelete.id);
            setTransactionToDelete(null);
            await refreshTransactions();
            toast.info('Transaction deleted');
        } catch (err) {
            console.error('Error deleting transaction:', err);
            toast.error('Failed to delete transaction');
        } finally {
            setIsDeleting(false);
        }
    };

    const showEditUnavailable = () => {
        toast.info('Edit needs an update API. Delete and add again for now.');
    };

    const handleWhatsAppReminder = async ({ normalizedMobileNumber, shouldUpdate }) => {
        if (!whatsAppPerson?.id) {
            setWhatsAppError('Unable to update this person. Please refresh and try again.');
            return;
        }

        try {
            setIsSavingWhatsAppNumber(true);
            setWhatsAppError('');

            if (shouldUpdate) {
                const result = await borrowLendApi.updateContact(whatsAppPerson.id, {
                    mobileNumber: normalizedMobileNumber,
                });
                if (!result.success) throw new Error(result.error || 'Failed to update mobile number');

                await refreshTransactions();
                setSelectedPerson((current) =>
                    current && current.id === whatsAppPerson.id
                        ? { ...current, mobileNumber: normalizedMobileNumber }
                        : current
                );
            }

            const reminderMessage = buildWhatsAppReminderMessage({
                personName: whatsAppPerson.personName,
                amount: whatsAppPerson.remaining,
                dueDate: whatsAppPerson.dueDate,
                formatAmount,
                context: whatsAppPerson.whatsAppContext,
            });
            const opened = openWhatsAppChat(normalizedMobileNumber, reminderMessage);
            if (!opened) {
                throw new Error('WhatsApp could not be opened on this device.');
            }

            toast.info('If WhatsApp does not open, please check that it is installed.');
            setWhatsAppPerson(null);
        } catch (error) {
            console.error('WhatsApp reminder error:', error);
            setWhatsAppError(error.message || 'Unable to open WhatsApp reminder.');
        } finally {
            setIsSavingWhatsAppNumber(false);
        }
    };

    if (loading) return <FullScreenLoader />;

    if (error) {
        return (
            <Container className={styles.container}>
                <div className={styles.errorState}>
                    <h1>Borrow/Lend</h1>
                    <p>Error loading transactions: {error}</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className={styles.container}>
            <Row>
                <Col lg={5} md={7} sm={9} className="mx-auto">
                    {selectedPerson ? (
                        <PersonLedger
                            person={selectedPerson}
                            transactions={selectedTransactions}
                            formatAmount={formatAmount}
                            onBack={() => setSelectedPerson(null)}
                            onRecordReturn={() => openAction(selectedPerson.type === TRANSACTION_TYPES.GAVE ? 'return' : 'repay')}
                            onWhatsAppReminder={() => {
                                setWhatsAppError('');
                                setWhatsAppPerson(selectedPerson);
                            }}
                            onEdit={showEditUnavailable}
                            onView={setTransactionDetails}
                            onDelete={setTransactionToDelete}
                        />
                    ) : (
                        <BorrowLendDashboard
                            people={people}
                            totalLent={getTotalGiven()}
                            totalBorrowed={getTotalTaken()}
                            formatAmount={formatAmount}
                            onSelectPerson={setSelectedPerson}
                        />
                    )}
                </Col>
            </Row>

            <FloatingActionMenu onAction={openAction} />

            {formState && (
                <Modal show onHide={closeForm} centered size="sm" className={styles.modalShell}>
                    <Modal.Body>
                        {formState.kind === 'add' ? (
                            <AddTransactionForm
                                key={formState.type}
                                initialType={formState.type}
                                contactPeople={people}
                                onAddTransaction={handleAddTransaction}
                                onCancel={closeForm}
                            />
                        ) : (
                            <RepaymentForm
                                mode={formState.kind}
                                selectedPerson={formState.selectedPerson}
                                remainingAmount={formState.remainingAmount}
                                onSaved={handleSavedRepayment}
                                onCancel={closeForm}
                            />
                        )}
                    </Modal.Body>
                </Modal>
            )}

            <DeleteConfirmationModal
                show={!!transactionToDelete}
                transaction={transactionToDelete}
                onConfirm={handleConfirmDelete}
                onCancel={() => setTransactionToDelete(null)}
                isDeleting={isDeleting}
            />

            <BorrowLendDetailsModal
                show={!!transactionDetails}
                transaction={transactionDetails}
                onHide={() => setTransactionDetails(null)}
                formatAmount={formatAmount}
            />

            <WhatsAppReminderModal
                show={!!whatsAppPerson}
                person={whatsAppPerson}
                isSaving={isSavingWhatsAppNumber}
                error={whatsAppError}
                onCancel={() => {
                    setWhatsAppPerson(null);
                    setWhatsAppError('');
                }}
                onContinue={handleWhatsAppReminder}
            />
        </Container>
    );
}

export default BorrowLend;
