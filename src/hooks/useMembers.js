import { membersApi } from '../services/api/expensesApi';

export const addMember = async (tripId, memberData) => {
    const result = await membersApi.addMember(tripId, memberData);
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const getMembers = async (tripId) => {
    const result = await membersApi.getMembers(tripId);
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const deleteMember = async (tripId, memberId) => {
    const result = await membersApi.deleteMember(tripId, memberId);
    if (!result.success) throw new Error(result.error);
};

