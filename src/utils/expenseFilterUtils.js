// Utility functions for filtering expenses

export const filterExpenses = (expenses, filters) => {
    if (!filters || !expenses) return expenses;

    return expenses.filter(expense => {
        // Filter by name (case insensitive partial match)
        if (filters.name && filters.name.trim()) {
            const nameMatch = expense.name.toLowerCase().includes(filters.name.toLowerCase().trim());
            if (!nameMatch) return false;
        }

        // Filter by minimum amount
        if (filters.amount && filters.amount.trim()) {
            const minAmount = parseFloat(filters.amount);
            if (isNaN(minAmount) || expense.amount < minAmount) return false;
        }

        // Filter by paid by (exact match for any selected member)
        if (filters.paidBy && filters.paidBy.length > 0) {
            const paidByMatch = filters.paidBy.includes(expense.paidBy);
            if (!paidByMatch) return false;
        }

        // Filter by participants (check if any selected participant is in expense participants)
        if (filters.participants && filters.participants.length > 0) {
            const participantMatch = filters.participants.some(filterParticipant =>
                expense.participants.some(expenseParticipant =>
                    expenseParticipant.name === filterParticipant
                )
            );
            if (!participantMatch) return false;
        }

        return true;
    });
};

export const getInitialFilters = () => ({
    name: '',
    amount: '',
    paidBy: [],
    participants: []
});

export const hasActiveFilters = (filters) => {
    return Boolean(
        filters.name ||
        filters.amount ||
        (filters.paidBy && filters.paidBy.length > 0) ||
        (filters.participants && filters.participants.length > 0)
    );
};