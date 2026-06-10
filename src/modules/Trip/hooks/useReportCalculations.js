import { useMemo } from 'react';

function useReportCalculations(members, expenses) {
    const calculations = useMemo(() => {
        const balances = {};
        const spentAmounts = {};
        const personShares = {};
        let totalExpense = 0;

        if (members.length === 0) {
            return {
                balances: {},
                spentAmounts: {},
                personShares: {},
                totalExpense: 0,
                transactions: []
            };
        }

        // Initialize balances and shares
        members.forEach((member) => {
            balances[member] = 0;
            spentAmounts[member] = 0;
            personShares[member] = 0;
        });

        // Calculate balances and shares
        expenses.forEach((expense) => {
            const share = expense.amount / expense.participants.length;

            // Update participant shares
            expense.participants.forEach((participant) => {
                balances[participant.name] -= share;
                personShares[participant.name] += share;
            });

            // Update payer balance and spent amount
            balances[expense.paidBy] += expense.amount;
            spentAmounts[expense.paidBy] += expense.amount;
            totalExpense += expense.amount;
        });

        // Calculate transactions for settlement
        const transactions = calculateTransactions(balances);

        return {
            balances,
            spentAmounts,
            personShares,
            totalExpense,
            transactions
        };
    }, [members, expenses]);

    return calculations;
}

function calculateTransactions(balances) {
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
}

export default useReportCalculations;