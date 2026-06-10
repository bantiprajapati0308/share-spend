import { expensesApi } from '../../../services/api/expensesApi';

export const addExpense = async (tripId, expenseData) => {
    const result = await expensesApi.addExpense(tripId, expenseData);
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const getExpenses = async (tripId) => {
    const result = await expensesApi.getExpenses(tripId);
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const deleteExpense = async (tripId, expenseId) => {
    const result = await expensesApi.deleteExpense(tripId, expenseId);
    if (!result.success) throw new Error(result.error);
};

export const updateExpense = async (tripId, expenseId, expenseData) => {
    const result = await expensesApi.updateExpense(tripId, expenseId, expenseData);
    if (!result.success) throw new Error(result.error);
    return result.data;
};
