import { useMemo, useState } from 'react';
import { Col, Container, Modal, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useLendingTransactions } from './hooks/useLendingTransactions';
import AddTransactionForm from './components/AddTransactionForm';
import BorrowLendAIReview from './components/BorrowLendAIReview';
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
import { addBorrowLendRecord, applyBorrowLendRepayment } from './utils/borrowLendFirestore';
import { TRANSACTION_TYPES } from './constants/transactionTypes';
import { buildPeopleLedger, buildPersonTimeline } from './utils/ledgerViewModel';
import { borrowLendApi } from '../../services/api/borrowLendApi';
import { addBorrowLendTransactionToDailySpend, getBorrowLendDailySpendKind } from './utils/dailySpendSync';
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
    const [aiReview, setAiReview] = useState(null);
    const [isParsingAi, setIsParsingAi] = useState(false);
    const [isSavingAi, setIsSavingAi] = useState(false);
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
    const activeSelectedPerson = useMemo(() => {
        if (!selectedPerson) return null;

        const latestPerson = people.find((person) =>
            person.key === selectedPerson.key ||
            (
                person.personName === selectedPerson.personName &&
                person.type === selectedPerson.type
            )
        );

        if (latestPerson) return latestPerson;

        return {
            ...selectedPerson,
            totalLent: 0,
            totalBorrowed: 0,
            totalReturned: 0,
            remaining: 0,
            dueDate: null,
            status: 'Settled',
            transactionCount: 0,
        };
    }, [people, selectedPerson]);
    const selectedTransactions = useMemo(
        () => buildPersonTimeline(expandedTransactions, activeSelectedPerson),
        [expandedTransactions, activeSelectedPerson]
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
            selectedPersonId: activeSelectedPerson?.id || '',
            selectedPerson: activeSelectedPerson?.personName || '',
            remainingAmount: activeSelectedPerson?.remaining || 0,
            mobileNumber: activeSelectedPerson?.mobileNumber || '',
            email: activeSelectedPerson?.email || '',
            dueDate: activeSelectedPerson?.dueDate || null,
        });
        if (kind === 'repay') setFormState({
            kind: 'repay',
            selectedPersonId: activeSelectedPerson?.id || '',
            selectedPerson: activeSelectedPerson?.personName || '',
            remainingAmount: activeSelectedPerson?.remaining || 0,
            mobileNumber: activeSelectedPerson?.mobileNumber || '',
            email: activeSelectedPerson?.email || '',
            dueDate: activeSelectedPerson?.dueDate || null,
        });
    };

    const handleAddTransaction = async (newTransaction) => {
        try {
            const { syncToDailySpend, ...borrowLendTransaction } = newTransaction;
            const savedRecord = await addBorrowLendRecord(borrowLendTransaction);
            let dailySpendSynced = false;

            if (syncToDailySpend) {
                try {
                    await addBorrowLendTransactionToDailySpend({
                        kind: getBorrowLendDailySpendKind({ type: borrowLendTransaction.type }),
                        personName: borrowLendTransaction.personName,
                        amount: borrowLendTransaction.amount,
                        date: borrowLendTransaction.date,
                        dueDate: borrowLendTransaction.dueDate,
                        description: borrowLendTransaction.description,
                    });
                    dailySpendSynced = true;
                } catch (syncError) {
                    console.error('Daily Spend sync failed:', syncError);
                    toast.warning('Transaction saved in Borrow/Lend, but could not be added to Daily Spend.');
                }
            }

            closeForm();
            await refreshTransactions();
            toast.success(dailySpendSynced ? 'Transaction added to Borrow/Lend and Daily Spend' : 'Transaction added successfully');
            openReminderFlow({
                id: savedRecord?.id || savedRecord?.entry?.id || '',
                personName: borrowLendTransaction.personName,
                mobileNumber: borrowLendTransaction.mobileNumber || '',
                email: borrowLendTransaction.email || '',
                remaining: Number(borrowLendTransaction.amount || 0),
                dueDate: borrowLendTransaction.dueDate || null,
                whatsAppContext: borrowLendTransaction.type === TRANSACTION_TYPES.TOOK ? 'new-took' : 'new-gave',
            }, { confirmBeforeOpen: true });
        } catch (err) {
            console.error('Error adding transaction:', err);
            toast.error('Failed to add transaction');
            throw err;
        }
    };

    const handleAIInput = async ({ text, image, type }) => {
        const defaultAction = ({
            [TRANSACTION_TYPES.GAVE]: 'lend',
            [TRANSACTION_TYPES.TOOK]: 'borrow',
            return: 'return',
            repay: 'repay',
        })[type] || null;
        setIsParsingAi(true);
        try {
            const result = await borrowLendApi.parseTransactions({ text, image, defaultAction });
            if (!result.success) throw new Error(result.error || 'Could not analyze transaction input');
            const parsedDrafts = result.data.transactions.map((transaction, index) => ({
                ...transaction,
                draftId: `${Date.now()}-${index}`,
                amount: transaction.amount == null ? '' : String(transaction.amount),
                personName: transaction.personMatch?.status === 'exact'
                    ? transaction.personMatch.matchedName
                    : transaction.personName || '',
                matchConfirmed: transaction.personMatch?.status !== 'suggested',
                syncToDailySpend: null,
            }));
            if (!parsedDrafts.length) {
                toast.info(result.data.warnings?.[0] || 'No Borrow/Lend transactions were found.');
                return;
            }
            setAiReview({ drafts: parsedDrafts, warnings: result.data.warnings || [] });
        } catch (parseError) {
            toast.error(parseError.message || 'Could not analyze transaction input');
        } finally {
            setIsParsingAi(false);
        }
    };

    const saveAiDrafts = async () => {
        if (!aiReview?.drafts?.length || isSavingAi) return;
        setIsSavingAi(true);
        const failedDrafts = [];
        const savedDrafts = [];
        let syncFailures = 0;

        for (const draft of aiReview.drafts) {
            const action = draft.action;
            const ledgerType = ['lend', 'return'].includes(action) ? TRANSACTION_TYPES.GAVE : TRANSACTION_TYPES.TOOK;
            const transaction = {
                personName: draft.personName.trim(),
                amount: Number(draft.amount),
                type: ledgerType,
                date: draft.date,
                dueDate: ['lend', 'borrow'].includes(action) ? draft.dueDate || null : null,
                description: draft.description || '',
            };

            try {
                let savedRecord;
                if (['lend', 'borrow'].includes(action)) {
                    savedRecord = await addBorrowLendRecord(transaction);
                } else {
                    savedRecord = await applyBorrowLendRepayment({
                        personName: transaction.personName,
                        repaymentAmount: transaction.amount,
                        date: transaction.date,
                        description: transaction.description,
                        type: ledgerType,
                    });
                }

                if (draft.syncToDailySpend === 'yes') {
                    try {
                        await addBorrowLendTransactionToDailySpend({
                            kind: getBorrowLendDailySpendKind({ type: ledgerType, mode: action === 'return' || action === 'repay' ? action : undefined }),
                            personName: transaction.personName,
                            amount: transaction.amount,
                            date: transaction.date,
                            dueDate: transaction.dueDate,
                            description: transaction.description,
                        });
                    } catch (syncError) {
                        syncFailures += 1;
                        console.error('Daily Spend sync failed:', syncError);
                    }
                }
                savedDrafts.push({ draft, transaction, savedRecord });
            } catch (saveError) {
                failedDrafts.push(draft);
                console.error('AI Borrow/Lend draft save failed:', saveError);
            }
        }

        if (savedDrafts.length) {
            await refreshTransactions();
            toast.success(`${savedDrafts.length} transaction${savedDrafts.length === 1 ? '' : 's'} saved${syncFailures ? `; ${syncFailures} Daily Spend sync${syncFailures === 1 ? '' : 's'} failed` : ''}`);
            const firstSaved = savedDrafts[0];
            const contact = people.find((person) => person.type === firstSaved.transaction.type && person.personName.toLowerCase() === firstSaved.transaction.personName.toLowerCase());
            openReminderFlow({
                id: firstSaved.savedRecord?.id || firstSaved.savedRecord?.entry?.id || '',
                personName: firstSaved.transaction.personName,
                mobileNumber: contact?.mobileNumber || '',
                email: contact?.email || '',
                remaining: firstSaved.transaction.amount,
                dueDate: firstSaved.transaction.dueDate,
                whatsAppContext: ({ lend: 'new-gave', borrow: 'new-took', return: 'return', repay: 'repay' })[firstSaved.draft.action],
            }, { confirmBeforeOpen: true });
        }

        if (failedDrafts.length) {
            setAiReview({ ...aiReview, drafts: failedDrafts, warnings: [...aiReview.warnings, `${failedDrafts.length} transaction${failedDrafts.length === 1 ? '' : 's'} could not be saved. Review and retry.`] });
        } else {
            setAiReview(null);
            closeForm();
        }
        setIsSavingAi(false);
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
                    {activeSelectedPerson ? (
                        <PersonLedger
                            person={activeSelectedPerson}
                            transactions={selectedTransactions}
                            formatAmount={formatAmount}
                            onBack={() => setSelectedPerson(null)}
                            onRecordReturn={() => openAction(activeSelectedPerson.type === TRANSACTION_TYPES.GAVE ? 'return' : 'repay')}
                            onWhatsAppReminder={() => {
                                openReminderFlow(activeSelectedPerson);
                            }}
                            onUpdateContact={() => setContactPerson(activeSelectedPerson)}
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
                            onAIInput={handleAIInput}
                            aiBusy={isParsingAi}
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

            <Modal show={!!aiReview} onHide={() => !isSavingAi && setAiReview(null)} centered size="lg" scrollable className={styles.modalShell}>
                <Modal.Body>
                    {aiReview && <BorrowLendAIReview
                        drafts={aiReview.drafts}
                        warnings={aiReview.warnings}
                        people={people}
                        saving={isSavingAi}
                        onChange={(index, changes) => setAiReview((current) => ({ ...current, drafts: current.drafts.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...changes } : draft) }))}
                        onRemove={(index) => setAiReview((current) => ({ ...current, drafts: current.drafts.filter((_, draftIndex) => draftIndex !== index) }))}
                        onSave={saveAiDrafts}
                        onCancel={() => setAiReview(null)}
                    />}
                </Modal.Body>
            </Modal>

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
