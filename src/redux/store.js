import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import tripReducer from './tripSlice';
import dailySpendsReducer from './dailySpendsSlice';
import appConfigReducer from './appConfigSlice';

// Combine reducers (in case you have more in the future)
const rootReducer = combineReducers({
    trip: tripReducer,
    dailySpends: dailySpendsReducer,
    appConfig: appConfigReducer,
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
