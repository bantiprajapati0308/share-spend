import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    trip: {
        name: '',
        description: '',
        organizer: ''
    },
    members: [],
    expenses: []
};

const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {
        setTrip(state, action) {
            state.trip = action.payload;
        },
        addMember(state, action) {
            state.members.push(action.payload);
        },
        editMember(state, action) {
            const { editIndex, memberName } = action.payload;
            if (editIndex >= 0 && editIndex < state.members.length) {
                state.members[editIndex] = memberName;
            }
        },
        removeMember(state, action) {
            state.members = state.members.filter((member) => member !== action.payload);
        },
        addExpense(state, action) {
            state.expenses.push(action.payload);
        },
        removeExpense(state, action) {
            state.expenses = state.expenses.filter((expense) => expense.name !== action.payload);
        }
    }
});

export const { setTrip, addMember, editMember, addExpense, removeMember, removeExpense } = tripSlice.actions;
export default tripSlice.reducer;
