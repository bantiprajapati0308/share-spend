import React from 'react';
import { useSelector } from 'react-redux';
import { Button, Container, Row, Col, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import { utils, writeFile } from 'xlsx';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Report.module.scss';
function Report() {
    const members = useSelector((state) => state.trip.members);
    const expenses = useSelector((state) => state.trip.expenses);
    const currency = useSelector((state) => state.trip.currency);
    const currencyIcon = String(getCurrencySymbol(currency))

    const calculateBalances = () => {
        const balances = {};
        const spentAmounts = {};
        let totalExpense = 0;

        members.forEach((member) => {
            balances[member] = 0;
            spentAmounts[member] = 0;
        });

        expenses.forEach((expense) => {
            const share = expense.amount / expense.participants.length;
            expense.participants.forEach((participant) => {
                balances[participant] -= share;
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
                `${index + 1}. ${expense.name} - ${currencyIcon} ${expense.amount} - Paid by ${expense.paidBy} - Participants: ${expense.participants.join(', ')}`,
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
            Participants: expense.participants.join(', '),
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

    return (
        <Container fluid className="margin-bttom">
            <Row>
                <Col>
                    <h2 className="mt-3 mb-3">Expense Report</h2>
                    <h5>Total Expense: <strong>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</strong></h5>
                    <Button variant="primary" onClick={generatePDF}>Export as PDF</Button>
                    <Button variant="success" className="ml-2" onClick={generateExcel}>Export as Excel</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h3 className="mt-4 mb-3">Expenses</h3>
                    <Table responsive bordered hover>
                        <thead>
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
                                    <td>{expense.participants.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h3 className="mt-4 mb-3">Spent Amounts</h3>
                    <Table responsive bordered hover>
                        <thead>
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
                </Col>
            </Row>
            <Row>
                <Col>
                    <h3 className="mt-4 mb-3">Balances including Total Expense</h3>
                    <Table responsive bordered hover>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Balance</th>
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
                </Col>
            </Row>
        </Container>
    );
}

export default Report;
