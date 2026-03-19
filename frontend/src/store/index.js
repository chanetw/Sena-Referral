import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import agentsReducer from './agentsSlice';
import customersReducer from './customersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agents: agentsReducer,
    customers: customersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;