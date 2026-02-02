import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Table, Accordion, Form } from 'react-bootstrap';
import jsPDF from 'jspdf';
import { auth } from '../firebase';
import { utils, writeFile } from 'xlsx';
import { getCurrencySymbol, getGradientColor } from '../Util';
import styles from '../assets/scss/Report.module.scss';
import { PeopleFill, FileEarmarkArrowDown, FileEarmarkExcel, PiggyBank, CashStack, Filter, X } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembers, getExpenses } from '../hooks/useReport'; // Import new APIs
import FullScreenLoader from './common/FullScreenLoader';
import Select from 'react-select';
import { filterExpenses, getInitialFilters } from '../utils/expenseFilterUtils';

function Report() {
    const { tripId } = useParams();
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [currency, setCurrency] = useState('INR'); // You can fetch currency from trip if needed
    const currencyIcon = String(getCurrencySymbol(currency));
    const [showParticipants, setShowParticipants] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [loadingReport, setLoadingReport] = useState(true);
    const [activeAccordion, setActiveAccordion] = useState("0");
    const [activeAccordion2, setActiveAccordion2] = useState("1");
    const [activeAccordion3, setActiveAccordion3] = useState("2");
    const [activeAccordion4, setActiveAccordion4] = useState("3");
    const [activeAccordion5, setActiveAccordion5] = useState("4");
    const [expenseFilters, setExpenseFilters] = useState(getInitialFilters());
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();
    const user = auth.currentUser;
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

    const calculateBalances = () => {
        const balances = {};
        const spentAmounts = {};
        let totalExpense = 0;
        if (members.length === 0) {
            return { balances: {}, spentAmounts: {}, totalExpense: 0 };
        }
        members.forEach((member) => {
            balances[member] = 0;
            spentAmounts[member] = 0;
        });
        expenses.forEach((expense) => {
            const share = expense.amount / expense.participants.length;
            expense.participants.forEach((participant) => {
                balances[participant.name] -= share;
            });
            balances[expense.paidBy] += expense.amount;
            spentAmounts[expense.paidBy] += expense.amount;
            totalExpense += expense.amount;
        });
        return { balances, spentAmounts, totalExpense };
    };

    const { balances, spentAmounts, totalExpense } = calculateBalances();

    const calculatePerPersonShares = () => {
        const personShares = {};

        members.forEach((member) => {
            personShares[member] = 0;
        });

        expenses.forEach((expense) => {
            const share = expense.amount / expense.participants.length;
            expense.participants.forEach((participant) => {
                personShares[participant.name] += share;
            });
        });

        return personShares;
    };

    const personShares = calculatePerPersonShares();
    const calculateTransactions = (balances) => {
        const debtors = [];
        const creditors = [];

        // Split members into debtors and creditors
        Object.entries(balances).forEach(([member, balance]) => {
            if (balance < 0) {
                debtors.push({ member, amount: -balance }); // owe money
            } else if (balance > 0) {
                creditors.push({ member, amount: balance }); // should receive
            }
        });

        const transactions = [];

        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settledAmount = Math.min(debtor.amount, creditor.amount);

            transactions.push({
                from: debtor.member,
                to: creditor.member,
                amount: settledAmount
            });

            debtor.amount -= settledAmount;
            creditor.amount -= settledAmount;

            if (debtor.amount === 0) i++;
            if (creditor.amount === 0) j++;
        }

        return transactions;
    };
    const transactions = calculateTransactions(balances);

    const generateExcel = () => {
        const expenseData = expenses.map((expense, index) => ({
            No: index + 1,
            Name: expense.name,
            Amount: expense.amount,
            PaidBy: expense.paidBy,
            Participants: expense.participants.map((p) => p.name).join(', '),
        }));

        const spentData = Object.keys(spentAmounts).map((member) => ({
            Member: member,
            Spent: spentAmounts[member].toFixed(2),
        }));

        const balanceData = Object.keys(balances).map((member) => ({
            Member: member,
            Balance: balances[member].toFixed(2),
        }));

        const totalExpenseData = [{
            TotalExpense: totalExpense.toFixed(2),
            user: user.email
        }];
        const settlementData = transactions.length === 0
            ? [{ Message: "All settled! 🎉" }]
            : transactions.map((t, index) => ({
                No: index + 1,
                Payer: t.from,
                Receiver: t.to,
                Amount: t.amount.toFixed(2),
            }));



        const wb = utils.book_new();
        const wsExpenses = utils.json_to_sheet(expenseData);
        const wsSpent = utils.json_to_sheet(spentData);
        const wsBalances = utils.json_to_sheet(balanceData);
        const wsTotalExpense = utils.json_to_sheet(totalExpenseData);
        const wsSettlements = utils.json_to_sheet(settlementData);

        utils.book_append_sheet(wb, wsSettlements, 'Settlements');
        utils.book_append_sheet(wb, wsExpenses, 'Expenses');
        utils.book_append_sheet(wb, wsSpent, 'Spent Amounts');
        utils.book_append_sheet(wb, wsBalances, 'Balances');
        utils.book_append_sheet(wb, wsTotalExpense, 'Total Expense');
        writeFile(wb, 'report.xlsx');
    };

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
                        <h2 className="mt-3 mb-3 text-primary fw-bold" style={{ letterSpacing: 1 }}>Expense Report</h2>
                        <Button
                            variant="outline-primary"
                            className="fw-semibold"
                            style={{ borderRadius: 8 }}
                            onClick={() => navigate(`/share-spend/expenses/${tripId}`)} // Pass tripId in the route
                        >
                            Back
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <h5 className="mb-4">Total Expense: <strong className="text-success">{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</strong></h5>
                        <div className="d-flex gap-2 mb-4 flex-wrap">
                            <Button variant="success" className="d-flex align-items-center gap-2 fw-semibold shadow-sm px-3 py-2" onClick={generateExcel} style={{ borderRadius: 8 }}>
                                <FileEarmarkExcel size={18} /> Export as Excel
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/* Mobile-First Expenses Accordion */}
                <Accordion activeKey={activeAccordion} className='mb-2' onSelect={setActiveAccordion} defaultActiveKey="0" alwaysOpen >
                    <Accordion.Item eventKey="0" className={styles.accordionItem}>
                        <Accordion.Header>
                            <PiggyBank className="me-2 mb-1" size={22} />
                            Expenses ({filteredExpenses.length})
                        </Accordion.Header>
                        <Accordion.Body className='px-2'>
                            {/* Filter Toggle */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Button
                                    variant={showFilters ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={toggleFilters}
                                    className="d-flex align-items-center gap-1"
                                >
                                    <Filter size={14} />
                                    Filters
                                    {(expenseFilters.name || expenseFilters.amount || (expenseFilters.paidBy && expenseFilters.paidBy.length > 0) || (expenseFilters.participants && expenseFilters.participants.length > 0)) && (
                                        <span className="badge bg-warning text-dark ms-1">ON</span>
                                    )}
                                </Button>
                                {(expenseFilters.name || expenseFilters.amount || (expenseFilters.paidBy && expenseFilters.paidBy.length > 0) || (expenseFilters.participants && expenseFilters.participants.length > 0)) && (
                                    <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Collapsible Filter Panel */}
                            {showFilters && (
                                <div className="mb-3 p-3 border rounded-3" style={{ background: '#f8f9fa' }}>
                                    <div className="mb-3">
                                        <Form.Label className="small fw-semibold mb-2">Search by name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Type expense name..."
                                            value={expenseFilters.name || ''}
                                            onChange={(e) => handleFilterChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <Form.Label className="small fw-semibold mb-2">Minimum amount</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder={`Min amount in ${currency}...`}
                                            value={expenseFilters.amount || ''}
                                            onChange={(e) => handleFilterChange('amount', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <Form.Label className="small fw-semibold mb-2">Who paid</Form.Label>
                                        <Select
                                            isMulti
                                            options={memberOptions}
                                            value={memberOptions.filter(option =>
                                                expenseFilters.paidBy && expenseFilters.paidBy.includes(option.value)
                                            )}
                                            onChange={(selected) => handleMultiSelectChange('paidBy', selected)}
                                            placeholder="Select who paid..."
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <Form.Label className="small fw-semibold mb-2">Participants</Form.Label>
                                        <Select
                                            isMulti
                                            options={memberOptions}
                                            value={memberOptions.filter(option =>
                                                expenseFilters.participants && expenseFilters.participants.includes(option.value)
                                            )}
                                            onChange={(selected) => handleMultiSelectChange('participants', selected)}
                                            placeholder="Select participants..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mobile Card Layout */}
                            <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', boxShadow: '0 2px 8px #2196f322', border: '1px solid #e3e3e3', background: '#f8fafc' }}>
                                <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                    <thead className="table-primary">
                                        <tr>
                                            <th>No</th>
                                            <th>Name</th>
                                            <th>Amount</th>
                                            <th>Paid By</th>
                                            <th>Participants</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.length > 0 ? (
                                            filteredExpenses.map((expense, index) => (
                                                <tr key={expense.id || index}>
                                                    <td>{index + 1}</td>
                                                    <td>{expense.name}</td>
                                                    <td>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</td>
                                                    <td>{expense.paidBy}</td>
                                                    <td style={{ maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', paddingRight: 30 }}>
                                                        <span>{expense.participants.slice(0, 2).map((p) => p.name).join(', ')}{expense.participants.length > 2 ? '' : ''}</span>
                                                        {expense.participants.length > 2 && (
                                                            <Button size="sm" variant="outline-info" className="ms-2 p-1 d-inline-flex align-items-center justify-content-center" style={{ borderRadius: '50%', width: 28, height: 28, position: 'absolute', right: 0 }} onClick={() => handleShowParticipants(expense.participants)} title="View All Participants">
                                                                <PeopleFill size={16} />
                                                            </Button>
                                                        )}
                                                        {expense.participants.length > 0 && expense.participants.length <= 2 && (
                                                            <Button size="sm" variant="outline-info" className="ms-2 p-1 d-inline-flex align-items-center justify-content-center" style={{ borderRadius: '50%', width: 28, height: 28, position: 'absolute', right: 0 }} onClick={() => handleShowParticipants(expense.participants)} title="View All Participants">
                                                                <PeopleFill size={16} />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted py-4">
                                                    {expenses.length === 0 ? 'No expenses found' : 'No expenses match your filters'}
                                                </td>
                                            </tr>
                                        )}
                                        {filteredExpenses.length > 0 && filteredExpenses.length !== expenses.length && (
                                            <tr className="table-info">
                                                <td colSpan="5" className="text-center py-2">
                                                    <small className="fw-semibold">
                                                        Showing {filteredExpenses.length} of {expenses.length} expenses
                                                    </small>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Participants Modal */}
                            {showParticipants && (
                                <div className="modal fade show" style={{ display: 'block', background: 'rgba(33,150,243,0.15)' }} tabIndex="-1">
                                    <div className="modal-dialog">
                                        <div className="modal-content" style={{ borderRadius: 16, border: '2px solid #1de9b6', boxShadow: '0 4px 24px #2196f355' }}>
                                            <div className="modal-header" style={{ background: 'linear-gradient(90deg, #1de9b6 0%, #2196f3 100%)', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                                                <h5 className="modal-title"><PeopleFill className="me-2" />Participants</h5>
                                                <button type="button" className="btn-close btn-close-white" onClick={handleCloseParticipants}></button>
                                            </div>
                                            <div className="modal-body" style={{ background: '#f4f8ff' }}>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {currentParticipants.map((p, i) => (
                                                        <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #e3f0ff', color: '#1769aa', fontWeight: 500 }}>
                                                            <PeopleFill className="me-2" style={{ color: '#1de9b6' }} />{p.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="modal-footer" style={{ background: '#e3f0ff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                                                <Button variant="success" onClick={handleCloseParticipants} style={{ borderRadius: 8, fontWeight: 600 }}>Close</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

                {/* Other Accordions remain the same */}
                <Accordion activeKey={activeAccordion2} className='mb-2' onSelect={setActiveAccordion2} defaultActiveKey="1" alwaysOpen >
                    <Accordion.Item eventKey="1" className={styles.accordionItem}>
                        <Accordion.Header><CashStack className="me-2 mb-1" size={20} />Spent Amounts</Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Spent Amount</th>
                                                    <th>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(spentAmounts)
                                                    .sort((a, b) => spentAmounts[b] - spentAmounts[a])
                                                    .map((member, index, sortedArray) => {
                                                        const percentage = totalExpense > 0 ? (spentAmounts[member] / totalExpense * 100).toFixed(1) : 0;
                                                        const maxAmount = sortedArray.length > 0 ? spentAmounts[sortedArray[0]] : 0;
                                                        const minAmount = sortedArray.length > 0 ? spentAmounts[sortedArray[sortedArray.length - 1]] : 0;

                                                        const textColor = getGradientColor(spentAmounts[member], minAmount, maxAmount);

                                                        return (
                                                            <tr key={index}>
                                                                <td style={{ color: '#1565c0', fontWeight: 500, background: '#e3f2fd' }}>{member}</td>
                                                                <td style={{ color: '#2e7d32', fontWeight: 500, background: '#e8f5e9' }}>{getCurrencySymbol(currency)}{spentAmounts[member].toFixed(2)}</td>
                                                                <td style={{ color: textColor, fontWeight: 'bold', background: '#fff3e0' }}>{percentage}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                <tr className='table-dark'>
                                                    <td>Total Expense</td>
                                                    <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                                                    <td>100.0%</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <Accordion activeKey={activeAccordion3} className='mb-2' onSelect={setActiveAccordion3} defaultActiveKey="2" alwaysOpen >
                    <Accordion.Item eventKey="2" className={styles.accordionItem}>
                        <Accordion.Header><PiggyBank className="me-2 mb-1" size={20} />Balances including Total Expense</Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th className='p-2'>Member</th>
                                                    <th className='p-2'>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(balances).map((member, index) => (
                                                    <tr key={index}>
                                                        <td className={balances[member] > 0 ? styles.positive : styles.negative}>{member}</td>
                                                        <td className={balances[member] > 0 ? styles.positive : styles.negative}>{getCurrencySymbol(currency)}{balances[member].toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <Accordion activeKey={activeAccordion4} onSelect={setActiveAccordion4} defaultActiveKey="0" alwaysOpen >
                    <Accordion.Item eventKey="3" className={styles.accordionItem}>
                        <Accordion.Header>
                            Final Settlements
                        </Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th>Payer</th>
                                                    <th>Receiver</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.length === 0 ? (
                                                    <tr><td colSpan="3" className="text-center">All settled! 🎉</td></tr>
                                                ) : (
                                                    transactions.map((t, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ color: '#1769aa', background: '#e3f0ff' }}>{t.from}</td>
                                                            <td style={{ color: '#2e7d32', background: '#e8f5e9' }}>{t.to}</td>
                                                            <td style={{ background: '#fffde7', color: '#222' }}>{getCurrencySymbol(currency)}{t.amount.toFixed(2)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
                <Accordion activeKey={activeAccordion5} onSelect={setActiveAccordion5} defaultActiveKey="4" alwaysOpen >
                    <Accordion.Item eventKey="4" className={styles.accordionItem}>
                        <Accordion.Header>
                            <PeopleFill className="me-2 mb-1" size={20} />Per Person Expense Summary
                        </Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th className='p-2'>Member</th>
                                                    <th className='p-2'>Total Share</th>
                                                    <th className='p-2'>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(personShares)
                                                    .sort((a, b) => personShares[b] - personShares[a])
                                                    .map((member, index, sortedArray) => {
                                                        const percentage = totalExpense > 0 ? (personShares[member] / totalExpense * 100).toFixed(1) : 0;
                                                        const maxShare = sortedArray.length > 0 ? personShares[sortedArray[0]] : 0;
                                                        const minShare = sortedArray.length > 0 ? personShares[sortedArray[sortedArray.length - 1]] : 0;

                                                        const textColor = getGradientColor(personShares[member], minShare, maxShare);

                                                        return (
                                                            <tr key={index}>
                                                                <td style={{ color: '#1565c0', fontWeight: 500, background: '#e3f2fd' }}>{member}</td>
                                                                <td style={{ color: '#2e7d32', fontWeight: 500, background: '#e8f5e9' }}>{getCurrencySymbol(currency)}{personShares[member].toFixed(2)}</td>
                                                                <td style={{ color: textColor, fontWeight: 'bold', background: '#fff3e0' }}>{percentage}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                <tr className='table-dark'>
                                                    <td>Total</td>
                                                    <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                                                    <td>100.0%</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        </>
    );
}

export default Report;