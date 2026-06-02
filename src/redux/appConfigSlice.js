import { createSlice } from '@reduxjs/toolkit';

const appConfigSlice = createSlice({
    name: 'appConfig',
    initialState: {
        paymentMethods: [],
    },
    reducers: {
        setPaymentMethods(state, action) {
            state.paymentMethods = action.payload;
        },
    },
});

export const { setPaymentMethods } = appConfigSlice.actions;
export default appConfigSlice.reducer;
