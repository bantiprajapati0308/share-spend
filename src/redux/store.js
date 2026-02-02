import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import tripReducer from './tripSlice';



// Combine reducers (in case you have more in the future)
const rootReducer = combineReducers({
    trip: tripReducer,
});

// Create store with root reducer
const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export default store;
