import { configureStore } from '@reduxjs/toolkit';
import adminReducer from '../slices/adminSlice';
import vendorReducer from '../slices/vendorSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    vendor: vendorReducer,
  },
});

export default store;
