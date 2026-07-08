import { useMemo, useState } from 'react';
import { Col, Container, Modal, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useLendingTransactions } from './hooks/useLendingTransactions';
import AddTransactionForm from './components/AddTransactionForm';
import BorrowLendDashboard from './components/BorrowLendDashboard';
import BorrowLendDetailsModal from './components/BorrowLendDetailsModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import FloatingActionMenu from './components/FloatingActionMenu';
import ContactInfoModal from './components/ContactInfoModal';
import PersonLedger from './components/PersonLedger';
import RepaymentForm from './components/RepaymentForm';
import WhatsAppReminderModal from './components/WhatsAppReminderModal';
import FullScreenLoader from '../../components/common/FullScreenLoader';
import { getCurrencySymbol } from '../../Util';
import { addBorrowLendRecord } from './utils/borrowLendFirestore';
import { TRANSACTION_TYPES } from './constants/transactionTypes';
import { buildPeopleLedger, buildPersonTimeline } from './utils/ledgerViewModel';
import { borrowLendApi } from '../../services/api/borrowLendApi';
import { buildWhatsAppReminderMessage, openWhatsAppApp, openWhatsAppChat } from './utils/whatsappHelper';
import { validateWhatsAppMobileNumber } from './utils/validationHelper';
import styles from './styles/BorrowLend.module.scss';

function BorrowLend() {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [formState, setFormState] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [transactionDetails, setTransactionDetails] = useState(null);
    const [contactPerson, setContactPerson] = useState(null);
    const [whatsAppPerson, setWhatsAppPerson] = useState(null);
    const [whatsAppConfirmPerson, setWhatsAppConfirmPerson] = useState(null);
    const [whatsAppError, setWhatsAppError] = useState('');
    const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);
    const [isSavingContact, setIsSavingContact] = useState(false);
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

    const buildReminderPayload = (person) => {
        const reminderMessage = buildWhatsAppReminderMessage({
            personName: person.personName,
            amount: person.remaining,
            dueDate: person.dueDate,
            formatAmount,
            context: person.whatsAppContext,
        });

        return { ...person, reminderMessage };
    };

    const openReminderFlow = (person, options = {}) => {
        const payload = buildReminderPayload(person);
        const validation = validateWhatsAppMobileNumber(payload.mobileNumber || '');

        setWhatsAppError('');

        if (validation.isValid) {
            if (options.confirmBeforeOpen) {
                setWhatsAppConfirmPerson({
                    ...payload,
                    normalizedMobileNumber: validation.normalized,
                });
                return;
            }

            const opened = openWhatsAppChat(validation.normalized, payload.reminderMessage);
            if (!opened) {
                toast.error('WhatsApp could not be opened on this device.');
                return;
            }
            toast.info('If WhatsApp does not open, please check that it is installed.');
            return;
        }

        setWhatsAppPerson(payload);
    };

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
            openReminderFlow({
                id: savedRecord?.id || savedRecord?.entry?.id || '',
                personName: newTransaction.personName,
                mobileNumber: newTransaction.mobileNumber || '',
                email: newTransaction.email || '',
                remaining: Number(newTransaction.amount || 0),
                dueDate: newTransaction.dueDate || null,
                whatsAppContext: newTransaction.type === TRANSACTION_TYPES.TOOK ? 'new-took' : 'new-gave',
            }, { confirmBeforeOpen: true });
        } catch (err) {
            console.error('Error adding transaction:', err);
            toast.error('Failed to add transaction');
        }
    };

    const handleSavedRepayment = async (savedRepayment = {}) => {
        const currentFormState = formState || {};
        closeForm();
        await refreshTransactions();
        openReminderFlow({
            id: savedRepayment.id || savedRepayment.entry?.id || currentFormState.selectedPersonId || '',
            personName: savedRepayment.personName || currentFormState.selectedPerson || '',
            mobileNumber: currentFormState.mobileNumber || '',
            email: currentFormState.email || '',
            remaining: Number(savedRepayment.amount || savedRepayment.repaymentAmount || 0),
            dueDate: currentFormState.dueDate || null,
            whatsAppContext: currentFormState.kind === 'repay' ? 'repay' : 'return',
        }, { confirmBeforeOpen: true });
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

    const handleSaveContact = async ({ mobileNumber, email }) => {
        if (!contactPerson?.id) {
            toast.error('Unable to update contact. Please refresh and try again.');
            return;
        }

        try {
            setIsSavingContact(true);
            const result = await borrowLendApi.updateContact(contactPerson.id, {
                mobileNumber,
                email,
            });
            if (!result.success) throw new Error(result.error || 'Failed to update contact information');

            setSelectedPerson((current) =>
                current && current.id === contactPerson.id
                    ? { ...current, mobileNumber, email }
                    : current
            );
            setContactPerson(null);
            await refreshTransactions();
            toast.success('Contact information updated successfully.');
        } catch (contactError) {
            console.error('Contact update error:', contactError);
            toast.error(contactError.message || 'Failed to update contact information.');
        } finally {
            setIsSavingContact(false);
        }
    };

    const handleOpenManualWhatsApp = async () => {
        try {
            setIsOpeningWhatsApp(true);
            setWhatsAppError('');
            const opened = openWhatsAppApp();
            if (!opened) {
                throw new Error('WhatsApp could not be opened on this device.');
            }
            toast.info('If WhatsApp does not open, please check that it is installed.');
        } catch (error) {
            console.error('WhatsApp reminder error:', error);
            setWhatsAppError(error.message || 'Unable to open WhatsApp.');
        } finally {
            setTimeout(() => setIsOpeningWhatsApp(false), 800);
        }
    };

    const handleConfirmWhatsAppSend = async () => {
        if (!whatsAppConfirmPerson?.normalizedMobileNumber) {
            setWhatsAppError('Unable to open WhatsApp. Mobile number is missing.');
            return;
        }

        try {
            setIsOpeningWhatsApp(true);
            setWhatsAppError('');
            const opened = openWhatsAppChat(
                whatsAppConfirmPerson.normalizedMobileNumber,
                whatsAppConfirmPerson.reminderMessage
            );
            if (!opened) throw new Error('WhatsApp could not be opened on this device.');

            toast.info('If WhatsApp does not open, please check that it is installed.');
            setWhatsAppConfirmPerson(null);
        } catch (error) {
            console.error('WhatsApp send confirmation error:', error);
            setWhatsAppError(error.message || 'Unable to open WhatsApp.');
        } finally {
            setTimeout(() => setIsOpeningWhatsApp(false), 800);
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
                                openReminderFlow(selectedPerson);
                            }}
                            onUpdateContact={() => setContactPerson(selectedPerson)}
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
                mode="manual"
                person={whatsAppPerson}
                message={whatsAppPerson?.reminderMessage || ''}
                isOpening={isOpeningWhatsApp}
                error={whatsAppError}
                onCancel={() => {
                    setWhatsAppPerson(null);
                    setWhatsAppError('');
                }}
                onOpenWhatsApp={handleOpenManualWhatsApp}
            />

            <WhatsAppReminderModal
                show={!!whatsAppConfirmPerson}
                mode="confirm"
                person={whatsAppConfirmPerson}
                message={whatsAppConfirmPerson?.reminderMessage || ''}
                mobileNumber={whatsAppConfirmPerson?.mobileNumber || ''}
                isOpening={isOpeningWhatsApp}
                error={whatsAppError}
                onCancel={() => {
                    setWhatsAppConfirmPerson(null);
                    setWhatsAppError('');
                }}
                onOpenWhatsApp={handleConfirmWhatsAppSend}
            />

            <ContactInfoModal
                show={!!contactPerson}
                person={contactPerson}
                isSaving={isSavingContact}
                onCancel={() => setContactPerson(null)}
                onSave={handleSaveContact}
            />
        </Container>
    );
}

export default BorrowLend;
