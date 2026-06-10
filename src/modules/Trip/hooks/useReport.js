import { membersApi, expensesApi } from '../../../services/api/expensesApi';

export const getMembers = async (tripId) => {
    const result = await membersApi.getMembers(tripId);
    if (!result.success) throw new Error(result.error);
    return result.data.map(m => m.name);
};

export const getExpenses = async (tripId) => {
    const result = await expensesApi.getExpenses(tripId);
    if (!result.success) throw new Error(result.error);
    return result.data;
};
