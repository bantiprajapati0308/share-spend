import React, { useState, useEffect, useMemo } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Report.module.scss';
import { useNavigate, useParams } from 'react-router-dom';
import FullScreenLoader from './common/FullScreenLoader';
import { filterExpenses } from '../utils/expenseFilterUtils';

// Import components that are still directly used
import ParticipantsModal from './report/ParticipantsModal';
import ExportActions from './report/ExportActions';
import SettlementModal from './report/settlement/SettlementModal';
import ToastNotification from './common/ToastNotification';

// Import hooks and utilities
import useReportCalculations from '../hooks/useReportCalculations';
import { generateExcelReport } from '../utils/excelExport';
import useSettlements from '../hooks/useSettlements';

// Import report utilities
import {
    fetchReportData,
    initializeFilters,
    initializeAccordionStates,
    createFilterHandlers,
    createAccordionHandlers,
    createModalHandlers,
    createToastHandlers,
    createSettlementHandler,
    createMemberOptions,
    calculateSettledBalances
} from '../utils/reportUtils';

import {
    renderExpensesAccordion,
    renderSpentAmountsAccordion,
    renderBalancesAccordion,
    renderSettlementsAccordion,
    renderPersonSharesAccordion,
    renderSettlementHistoryAccordion
} from '../utils/reportRenderUtils.jsx';

function Report() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    // Basic state
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [currency, setCurrency] = useState('INR');
    const [loadingReport, setLoadingReport] = useState(true);

    // Initialize states using utilities
    const [expenseFilters, setExpenseFilters] = useState(() => initializeFilters().filters);
    const [showFilters, setShowFilters] = useState(() => initializeFilters().showFilters);
    const [accordionStates, setAccordionStates] = useState(() => initializeAccordionStates());

    // Modal states
    const [showParticipants, setShowParticipants] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [settlementLoading, setSettlementLoading] = useState(false);

    // Toast notification states
    const [toast, setToast] = useState({ show: false, variant: 'success', title: '', message: '' });

    // Override balances and transactions for settlements (optimistic updates)
    const [overrideBalances, setOverrideBalances] = useState(null);
    const [overrideTransactions, setOverrideTransactions] = useState(null);

    // Use custom hooks - settlements hook first since it's used in calculations
    const {
        settlements,
        addSettlement,
        removeSettlement,
        getTotalSettled,
        getSettlementHistory,
        refreshSettlements
    } = useSettlements(tripId);

    // Calculate data including settlements
    const baseCalculatedData = useReportCalculations(members, expenses);

    // Apply settlements to get current state using utility function
    const calculatedData = useMemo(() =>
        calculateSettledBalances(baseCalculatedData, settlements),
        [baseCalculatedData, settlements]
    );

    // Use override data if available, otherwise use calculated data
    const { balances, spentAmounts, personShares, totalExpense } = calculatedData;
    const transactions = overrideTransactions || calculatedData.transactions;
    const currentBalances = overrideBalances || balances;
    // Fetch members and expenses from Firestore using utility
    useEffect(() => {
        async function loadReportData() {
            if (!tripId) return;

            setLoadingReport(true);
            try {
                const { members: memberList, expenses: expenseList } = await fetchReportData(tripId);
                setMembers(memberList);
                setExpenses(expenseList);
            } catch (error) {
                console.error('Failed to load report data:', error);
                // Could show toast notification here
            } finally {
                setLoadingReport(false);
            }
        }
        loadReportData();
    }, [tripId]);

    // Create handlers using utilities
    const { handleAccordionSelect } = createAccordionHandlers(setAccordionStates);

    const {
        handleFilterChange,
        handleMultiSelectChange,
        handleClearFilters,
        toggleFilters
    } = createFilterHandlers(setExpenseFilters, setShowFilters);

    const {
        handleShowParticipants,
        handleCloseParticipants,
        handleTransactionClick,
        handleCloseSettlementModal
    } = createModalHandlers(
        setShowParticipants,
        setCurrentParticipants,
        setShowSettlementModal,
        setSelectedTransaction
    );

    const {
        showSuccessToast,
        showErrorToast,
        handleToastClose
    } = createToastHandlers(setToast);

    const { handleSettlementSubmit } = createSettlementHandler({
        tripId,
        currency,
        currentBalances,
        addSettlement,
        removeSettlement,
        refreshSettlements,
        setOverrideBalances,
        setOverrideTransactions,
        setSettlementLoading,
        setShowSettlementModal,
        setSelectedTransaction,
        showSuccessToast,
        showErrorToast
    });

    // Excel export handler
    const handleExportExcel = () => {
        generateExcelReport(expenses, spentAmounts, balances, totalExpense, transactions);
    };

    // Apply filters to expenses
    const filteredExpenses = filterExpenses(expenses, expenseFilters);

    // Member options for select dropdowns using utility
    const memberOptions = createMemberOptions(members);

    return (
        <>
            {loadingReport && <FullScreenLoader />}
            <Container fluid className="margin-bttom">
                <Row>
                    <Col className="d-flex align-items-center mb-2 justify-content-between">
                        <h2 className="mt-3 mb-3 text-primary fw-bold" style={{ letterSpacing: 1 }}>
                            Expense Report
                        </h2>
                        <Button
                            variant="outline-primary"
                            className="fw-semibold"
                            style={{ borderRadius: 8 }}
                            onClick={() => navigate(`/share-spend/expenses/${tripId}`)}
                        >
                            Back
                        </Button>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <h5 className="mb-4">
                            Total Expense: <strong className="text-success">
                                {getCurrencySymbol(currency)}{totalExpense.toFixed(2)}
                            </strong>
                        </h5>
                        <ExportActions onExportExcel={handleExportExcel} />
                    </Col>
                </Row>

                {/* Expenses Accordion */}
                {renderExpensesAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    filteredExpenses,
                    showFilters,
                    toggleFilters,
                    expenseFilters,
                    handleFilterChange,
                    handleMultiSelectChange,
                    handleClearFilters,
                    memberOptions,
                    currency,
                    expenses,
                    handleShowParticipants
                })}

                {/* Spent Amounts Accordion */}
                {renderSpentAmountsAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    currency,
                    spentAmounts,
                    totalExpense
                })}

                {/* Balances Accordion */}
                {renderBalancesAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    currency,
                    balances,
                    styles
                })}

                {/* Settlements Accordion */}
                {renderSettlementsAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    currency,
                    transactions,
                    handleTransactionClick
                })}

                {/* Person Shares Accordion */}
                {renderPersonSharesAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    currency,
                    personShares,
                    totalExpense
                })}

                {/* Settlement History Accordion */}
                {renderSettlementHistoryAccordion({
                    accordionStates,
                    handleAccordionSelect,
                    settlements,
                    getSettlementHistory,
                    currency
                })}

                {/* Participants Modal */}
                <ParticipantsModal
                    show={showParticipants}
                    onClose={handleCloseParticipants}
                    participants={currentParticipants}
                />

                {/* Settlement Modal */}
                <SettlementModal
                    show={showSettlementModal}
                    onClose={handleCloseSettlementModal}
                    onSubmit={handleSettlementSubmit}
                    transaction={selectedTransaction}
                    members={members}
                    currency={currency}
                    loading={settlementLoading}
                />

                {/* Toast Notifications */}
                <ToastNotification
                    show={toast.show}
                    onClose={handleToastClose}
                    variant={toast.variant}
                    title={toast.title}
                    message={toast.message}
                />
            </Container>
        </>
    );
}

export default Report;