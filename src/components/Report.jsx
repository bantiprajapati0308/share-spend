import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Report.module.scss';
import { PeopleFill, PiggyBank, CashStack } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembers, getExpenses } from '../hooks/useReport';
import FullScreenLoader from './common/FullScreenLoader';
import { filterExpenses, getInitialFilters } from '../utils/expenseFilterUtils';

// Import new components
import ReportAccordion from './report/ReportAccordion';
import ReportTable from './report/ReportTable';
import ParticipantsModal from './report/ParticipantsModal';
import ExpenseFilters from './report/ExpenseFilters';
import ExpenseTable from './report/ExpenseTable';
import ExportActions from './report/ExportActions';

// Import hooks and utilities
import useReportCalculations from '../hooks/useReportCalculations';
import { generateExcelReport } from '../utils/excelExport';
import {
    createSpentAmountsRenderer,
    createBalancesRenderer,
    createTransactionsRenderer,
    createPersonSharesRenderer
} from './report/tableRenderers.jsx';

function Report() {
    const { tripId } = useParams();
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [currency, setCurrency] = useState('INR');
    const [showParticipants, setShowParticipants] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [loadingReport, setLoadingReport] = useState(true);
    const [expenseFilters, setExpenseFilters] = useState(getInitialFilters());
    const [showFilters, setShowFilters] = useState(false);

    // Accordion states
    const [accordionStates, setAccordionStates] = useState({
        expenses: "0",
        spentAmounts: "1",
        balances: "2",
        settlements: "3",
        personShares: "4"
    });

    const navigate = useNavigate();

    // Use custom hook for calculations
    const { balances, spentAmounts, personShares, totalExpense, transactions } = useReportCalculations(members, expenses);
    // Fetch members and expenses from Firestore
    useEffect(() => {
        async function fetchData() {
            setLoadingReport(true);
            const memberList = await getMembers(tripId);
            const expenseList = await getExpenses(tripId);
            setMembers(memberList);
            setExpenses(expenseList);
            setLoadingReport(false);
        }
        if (tripId) fetchData();
    }, [tripId]);

    // Handle accordion states
    const handleAccordionSelect = (accordionKey, eventKey) => {
        setAccordionStates(prev => ({
            ...prev,
            [accordionKey]: eventKey
        }));
    };

    // Expense filtering and participant modal handlers
    const handleShowParticipants = (participants) => {
        setCurrentParticipants(participants);
        setShowParticipants(true);
    };

    const handleCloseParticipants = () => setShowParticipants(false);

    const handleFilterChange = (field, value) => {
        setExpenseFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleMultiSelectChange = (field, selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setExpenseFilters(prev => ({
            ...prev,
            [field]: values
        }));
    };

    const handleClearFilters = () => {
        setExpenseFilters(getInitialFilters());
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Excel export handler
    const handleExportExcel = () => {
        generateExcelReport(expenses, spentAmounts, balances, totalExpense, transactions);
    };

    // Apply filters to expenses
    const filteredExpenses = filterExpenses(expenses, expenseFilters);

    // Member options for select dropdowns
    const memberOptions = members.map(member => ({
        value: member,
        label: member
    }));

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
                <ReportAccordion
                    activeKey={accordionStates.expenses}
                    onSelect={(eventKey) => handleAccordionSelect('expenses', eventKey)}
                    eventKey="0"
                    icon={PiggyBank}
                    title={`Expenses (${filteredExpenses.length})`}
                >
                    <ExpenseFilters
                        showFilters={showFilters}
                        toggleFilters={toggleFilters}
                        filters={expenseFilters}
                        onFilterChange={handleFilterChange}
                        onMultiSelectChange={handleMultiSelectChange}
                        onClearFilters={handleClearFilters}
                        memberOptions={memberOptions}
                        currency={currency}
                    />

                    <ExpenseTable
                        expenses={expenses}
                        filteredExpenses={filteredExpenses}
                        currency={currency}
                        onShowParticipants={handleShowParticipants}
                    />
                </ReportAccordion>

                {/* Spent Amounts Accordion */}
                <ReportAccordion
                    activeKey={accordionStates.spentAmounts}
                    onSelect={(eventKey) => handleAccordionSelect('spentAmounts', eventKey)}
                    eventKey="1"
                    icon={CashStack}
                    title="Spent Amounts"
                >
                    <ReportTable
                        headers={[
                            { label: 'Member' },
                            { label: 'Spent Amount' },
                            { label: 'Percentage' }
                        ]}
                        data={Object.keys(spentAmounts)
                            .sort((a, b) => spentAmounts[b] - spentAmounts[a])
                            .concat(['TOTAL'])}
                        renderRow={(member, index, sortedArray) => {
                            if (member === 'TOTAL') {
                                return (
                                    <tr key="total" className='table-dark'>
                                        <td>Total Expense</td>
                                        <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                                        <td>100.0%</td>
                                    </tr>
                                );
                            }
                            const membersOnly = Object.keys(spentAmounts).sort((a, b) => spentAmounts[b] - spentAmounts[a]);
                            const renderSpentAmounts = createSpentAmountsRenderer(currency, spentAmounts, totalExpense);
                            return renderSpentAmounts(member, index, membersOnly);
                        }}
                    />
                </ReportAccordion>

                {/* Balances Accordion */}
                <ReportAccordion
                    activeKey={accordionStates.balances}
                    onSelect={(eventKey) => handleAccordionSelect('balances', eventKey)}
                    eventKey="2"
                    icon={PiggyBank}
                    title="Balances including Total Expense"
                >
                    <ReportTable
                        headers={[
                            { label: 'Member', className: 'p-2' },
                            { label: 'Balance', className: 'p-2' }
                        ]}
                        data={Object.keys(balances).sort((a, b) => balances[b] - balances[a])}
                        renderRow={createBalancesRenderer(currency, balances, styles)}
                    />
                </ReportAccordion>

                {/* Settlements Accordion */}
                <ReportAccordion
                    activeKey={accordionStates.settlements}
                    onSelect={(eventKey) => handleAccordionSelect('settlements', eventKey)}
                    eventKey="3"
                    title="Final Settlements"
                >
                    <ReportTable
                        headers={[
                            { label: 'Payer' },
                            { label: 'Receiver' },
                            { label: 'Amount' }
                        ]}
                        data={transactions}
                        renderRow={createTransactionsRenderer(currency)}
                        emptyMessage="All settled! 🎉"
                    />
                </ReportAccordion>

                {/* Person Shares Accordion */}
                <ReportAccordion
                    activeKey={accordionStates.personShares}
                    onSelect={(eventKey) => handleAccordionSelect('personShares', eventKey)}
                    eventKey="4"
                    icon={PeopleFill}
                    title="Per Person Expense Summary"
                >
                    <ReportTable
                        headers={[
                            { label: 'Member', className: 'p-2' },
                            { label: 'Total Share', className: 'p-2' },
                            { label: 'Percentage', className: 'p-2' }
                        ]}
                        data={Object.keys(personShares)
                            .sort((a, b) => personShares[b] - personShares[a])
                            .concat(['TOTAL'])}
                        renderRow={(member, index, sortedArray) => {
                            if (member === 'TOTAL') {
                                return (
                                    <tr key="total" className='table-dark'>
                                        <td>Total</td>
                                        <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                                        <td>100.0%</td>
                                    </tr>
                                );
                            }
                            const membersOnly = Object.keys(personShares).sort((a, b) => personShares[b] - personShares[a]);
                            const renderPersonShares = createPersonSharesRenderer(currency, personShares, totalExpense);
                            return renderPersonShares(member, index, membersOnly);
                        }}
                    />
                </ReportAccordion>

                {/* Participants Modal */}
                <ParticipantsModal
                    show={showParticipants}
                    onClose={handleCloseParticipants}
                    participants={currentParticipants}
                />
            </Container>
        </>
    );
}

export default Report;