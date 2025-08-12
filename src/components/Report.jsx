import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Table, Accordion } from 'react-bootstrap';
import jsPDF from 'jspdf';
import { utils, writeFile } from 'xlsx';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Report.module.scss';
import { PeopleFill, FileEarmarkArrowDown, FileEarmarkExcel, PiggyBank, CashStack } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getMembers, getExpenses } from '../hooks/useReport'; // Import new APIs
import FullScreenLoader from './common/FullScreenLoader';

function Report() {
    const { tripId } = useParams();
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [currency, setCurrency] = useState('INR'); // You can fetch currency from trip if needed
    const currencyIcon = String(getCurrencySymbol(currency));
    const [showParticipants, setShowParticipants] = useState(false);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [loadingReport, setLoadingReport] = useState(true);
    const navigate = useNavigate();

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

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text('Expense Report', 20, 20);

        doc.text(`Total Expense: ${currencyIcon} ${totalExpense.toFixed(2)}`, 20, 30);

        doc.text('Expenses:', 20, 40);
        expenses.forEach((expense, index) => {
            doc.text(
                `${index + 1}. ${expense.name} - ${currencyIcon} ${expense.amount} - Paid by ${expense.paidBy} - Participants: ${expense.participants.map((p) => p.name).join(', ')}`,
                20,
                50 + index * 10
            );
        });

        doc.addPage();
        doc.text('Spent Amounts:', 20, 20);
        Object.keys(spentAmounts).forEach((member, index) => {
            doc.text(`${member}: ${currencyIcon} ${spentAmounts[member].toFixed(2)}`, 20, 30 + index * 10);
        });

        doc.addPage();
        doc.text('Balances:', 20, 20);
        Object.keys(balances).forEach((member, index) => {
            doc.text(`${member}: ${currencyIcon} ${balances[member].toFixed(2)}`, 20, 30 + index * 10);
        });

        doc.save('report.pdf');
    };

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
        }];

        const wb = utils.book_new();
        const wsExpenses = utils.json_to_sheet(expenseData);
        const wsSpent = utils.json_to_sheet(spentData);
        const wsBalances = utils.json_to_sheet(balanceData);
        const wsTotalExpense = utils.json_to_sheet(totalExpenseData);

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
                            <Button variant="info" className="d-flex align-items-center gap-2 fw-semibold shadow-sm px-3 py-2" onClick={generatePDF} style={{ borderRadius: 8 }}>
                                <FileEarmarkArrowDown size={18} /> Export as PDF
                            </Button>
                            <Button variant="success" className="d-flex align-items-center gap-2 fw-semibold shadow-sm px-3 py-2" onClick={generateExcel} style={{ borderRadius: 8 }}>
                                <FileEarmarkExcel size={18} /> Export as Excel
                            </Button>
                        </div>
                    </Col>
                </Row>
                <Accordion defaultActiveKey="0" alwaysOpen >
                    <Accordion.Item eventKey="0" className={styles.accordionItem}>
                        <Accordion.Header><PiggyBank className="me-2 mb-1" size={22} />Expenses</Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <div style={{ maxHeight: '340px', overflowY: 'auto', overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px #2196f322', border: '1px solid #e3e3e3', background: '#f8fafc' }}>
                                <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                                    <thead className="table-primary sticky-top">
                                        <tr>
                                            <th>No</th>
                                            <th>Name</th>
                                            <th>Amount</th>
                                            <th>Paid By</th>
                                            <th>Participants</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((expense, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{expense.name}</td>
                                                <td>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</td>
                                                <td>{expense.paidBy}</td>
                                                <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', paddingRight: 20 }}>
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
                                        ))}
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
                    <Accordion.Item eventKey="1" className={styles.accordionItem}>
                        <Accordion.Header><CashStack className="me-2 mb-1" size={20} />Spent Amounts</Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover size="sm" className="mb-0 align-middle text-nowrap">
                                            <thead className="table-info">
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Spent Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(spentAmounts).map((member, index) => (
                                                    <tr key={index}>
                                                        <td>{member}</td>
                                                        <td>{getCurrencySymbol(currency)}{spentAmounts[member].toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr className='table-dark'>
                                                    <td>Total Expense</td>
                                                    <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2" className={styles.accordionItem}>
                        <Accordion.Header><PiggyBank className="me-2 mb-1" size={20} />Balances including Total Expense</Accordion.Header>
                        <Accordion.Body className='px-2'>
                            <Row>
                                <Col>
                                    <div className="bg-white">
                                        <Table responsive bordered hover size="sm" className="mb-0 align-middle text-nowrap">
                                            <thead className="table-success">
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
            </Container>
        </>
    );
}

export default Report;
