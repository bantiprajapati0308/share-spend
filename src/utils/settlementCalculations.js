/**
 * Pure functions for settlement calculations
 * These functions handle the business logic for partial settlements
 */

/**
 * Validates settlement input data
 */
export function validateSettlement(amount, payer, receiver, maxAmount) {
    const errors = {};

    if (!amount || amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(amount.toFixed(2)) > parseFloat(maxAmount.toFixed(2))) {
        errors.amount = `Amount cannot exceed ${maxAmount.toFixed(2)}`;
    }

    if (!payer) {
        errors.payer = 'Please select who is paying';
    }

    if (!receiver) {
        errors.receiver = 'Please select who is receiving';
    }

    if (payer && receiver && payer === receiver) {
        errors.receiver = 'Payer and receiver cannot be the same person';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Applies a settlement to the current balances and recalculates transactions
 */
export function applySettlement(currentBalances, settlementData) {
    const { amount, payer, receiver } = settlementData;

    // Create a copy of current balances
    const newBalances = { ...currentBalances };

    // Apply the settlement: payer pays receiver
    newBalances[payer] = (newBalances[payer] || 0) + amount;  // payer's balance increases
    newBalances[receiver] = (newBalances[receiver] || 0) - amount;  // receiver's balance decreases

    // Recalculate transactions from new balances
    const newTransactions = calculateTransactionsFromBalances(newBalances);

    return {
        balances: newBalances,
        transactions: newTransactions
    };
}

/**
 * Calculates settlement transactions from balance data
 * This is the same logic from useReportCalculations but as a pure function
 */
export function calculateTransactionsFromBalances(balances) {
    const debtors = [];
    const creditors = [];

    // Split members into debtors and creditors
    Object.entries(balances).forEach(([member, balance]) => {
        if (balance < -0.01) { // Small threshold to handle floating point precision
            debtors.push({ member, amount: -balance });
        } else if (balance > 0.01) {
            creditors.push({ member, amount: balance });
        }
    });

    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const settledAmount = Math.min(debtor.amount, creditor.amount);

        // Only add transaction if amount is meaningful
        if (settledAmount > 0.01) {
            transactions.push({
                from: debtor.member,
                to: creditor.member,
                amount: settledAmount
            });
        }

        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        if (debtor.amount <= 0.01) i++;
        if (creditor.amount <= 0.01) j++;
    }

    return transactions;
}

/**
 * Finds a transaction by payer and receiver
 */
export function findTransaction(transactions, payer, receiver) {
    return transactions.find(t => t.from === payer && t.to === receiver);
}

/**
 * Updates a specific transaction amount
 */
export function updateTransaction(transactions, originalTransaction, newAmount) {
    return transactions.map(transaction => {
        if (transaction.from === originalTransaction.from &&
            transaction.to === originalTransaction.to) {
            return {
                ...transaction,
                amount: newAmount
            };
        }
        return transaction;
    }).filter(t => t.amount > 0.01); // Remove transactions that become zero/negligible
}