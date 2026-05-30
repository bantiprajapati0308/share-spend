import { createSlice } from '@reduxjs/toolkit';

/**
 * Redux slice for DailySpends transactions.
 * useDailyExpenses writes here on every mutation so that other components
 * (e.g. LimitsManager) can read the already-loaded data without calling the API again.
 */
const dailySpendsSlice = createSlice({
    name: 'dailySpends',
    initialState: {
        transactions: [],
    },
    reducers: {
        /** Replace the entire transactions list (initial load / refresh). */
        setTransactions(state, action) {
            state.transactions = action.payload;
        },
        /** Prepend a newly-added transaction and keep sort order. */
        appendTransaction(state, action) {
            state.transactions = [action.payload, ...state.transactions].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
        },
        /** Update a transaction in-place. */
        patchTransaction(state, action) {
            const idx = state.transactions.findIndex(t => t.id === action.payload.id);
            if (idx !== -1) state.transactions[idx] = action.payload;
        },
        /** Remove a transaction by id. */
        removeTransaction(state, action) {
            state.transactions = state.transactions.filter(t => t.id !== action.payload);
        },
    },
});

export const { setTransactions, appendTransaction, patchTransaction, removeTransaction } = dailySpendsSlice.actions;
export default dailySpendsSlice.reducer;
