import { settlementsApi } from '../../../services/api/settlementsApi';

export const processSettlement = async (tripId, settlementData) => {
    const { amount, payer, receiver, originalTransaction } = settlementData;
    const result = await settlementsApi.createSettlement({
        tripId,
        amount: parseFloat(amount),
        payer,
        receiver,
        originalAmount: originalTransaction.amount,
        originalPayer: originalTransaction.from,
        originalReceiver: originalTransaction.to,
        status: 'completed',
    });
    if (!result.success) throw new Error(result.error || 'Failed to process settlement.');
    return { success: true, settlementId: result.data.id, timestamp: new Date().toISOString() };
};

export const updateTripBalances = async (tripId, newBalances) => {
    const serializableBalances = {};
    Object.entries(newBalances).forEach(([member, balance]) => {
        if (typeof balance === 'number' && !isNaN(balance)) {
            serializableBalances[member] = Number(balance.toFixed(2));
        }
    });
    const result = await settlementsApi.updateTripBalances(tripId, { calculatedBalances: serializableBalances });
    if (!result.success) throw new Error(result.error || 'Failed to update trip balances.');
    return { success: true, timestamp: new Date().toISOString() };
};

export const getTripSettlements = async (tripId) => {
    const result = await settlementsApi.getTripSettlements(tripId);
    if (!result.success) throw new Error(result.error || 'Failed to load settlement history.');
    return result.data.map(s => ({
        ...s,
        createdAt: s.createdAt ? new Date(s.createdAt._seconds ? s.createdAt._seconds * 1000 : s.createdAt) : null,
    }));
};

export const processBatchSettlements = async (tripId, settlementsArray) => {
    const settlements = settlementsArray.map(s => ({
        tripId,
        amount: parseFloat(s.amount),
        payer: s.payer,
        receiver: s.receiver,
        originalAmount: s.originalTransaction.amount,
        originalPayer: s.originalTransaction.from,
        originalReceiver: s.originalTransaction.to,
        status: 'completed',
    }));
    const result = await settlementsApi.createBatchSettlements({ tripId, settlements });
    if (!result.success) throw new Error(result.error || 'Failed to process settlements.');
    return { success: true, timestamp: new Date().toISOString() };
};
