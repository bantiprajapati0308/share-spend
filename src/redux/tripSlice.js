import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    trip: {
        name: '',
        description: '',
        organizer: ''
    },
    members: [],
    expenses: [],
    currency: '',
};

const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {
        setTrip(state, action) {
            state.trip = action.payload;
        },
        addMember(state, action) {
            const { id, name } = action.payload;
            state.members.push({ id, name });
        },
        editMember(state, action) {
            const { editIndex, memberName } = action.payload;
            if (editIndex >= 0 && editIndex < state.members.length) {
                state.members[editIndex].name = memberName;
            }
        },
        removeMember(state, action) {
            state.members = state.members.filter((member) => member.id !== action.payload);
        },
        addExpense(state, action) {
            state.expenses.push(action.payload);
        },
        updateExpense(state, action) {
            const updated = action.payload;
            const idx = state.expenses.findIndex(exp => exp.id === updated.id);
            if (idx !== -1) {
                state.expenses[idx] = updated;
            }
        },
        removeExpense(state, action) {
            state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
        },
        selectCurrency(state, action) {
            state.currency = action.payload;
        }
    }
});

export const { setTrip, addMember, editMember, addExpense, updateExpense, removeMember, removeExpense, selectCurrency } = tripSlice.actions;
export default tripSlice.reducer;
