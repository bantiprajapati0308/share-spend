import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    status: 'idle',
    prompt: '',
    transactions: [],
    warnings: [],
    missingFields: [],
    error: null,
};

const quickAddSlice = createSlice({
    name: 'quickAdd',
    initialState,
    reducers: {
        setPrompt(state, action) {
            state.prompt = action.payload;
        },
        parseStarted(state) {
            state.status = 'loading';
            state.error = null;
        },
        parseSucceeded(state, action) {
            state.status = 'review';
            state.transactions = action.payload.transactions;
            state.warnings = action.payload.warnings || [];
            state.missingFields = action.payload.missingFields || [];
        },
        parseFailed(state, action) {
            state.status = 'error';
            state.error = action.payload;
        },
        updateQuickTransaction(state, action) {
            const { index, changes } = action.payload;
            if (state.transactions[index]) Object.assign(state.transactions[index], changes);
        },
        removeQuickTransaction(state, action) {
            state.transactions.splice(action.payload, 1);
        },
        resetQuickAdd() {
            return initialState;
        },
    },
});

export const {
    setPrompt,
    parseStarted,
    parseSucceeded,
    parseFailed,
    updateQuickTransaction,
    removeQuickTransaction,
    resetQuickAdd,
} = quickAddSlice.actions;

export default quickAddSlice.reducer;
