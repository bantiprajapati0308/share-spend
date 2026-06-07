import { utils, writeFile } from 'xlsx';
import { auth } from '../firebase';

export const generateExcelReport = (expenses, spentAmounts, balances, totalExpense, transactions) => {
    const user = auth.currentUser;

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