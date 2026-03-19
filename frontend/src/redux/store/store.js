import { configureStore } from '@reduxjs/toolkit';
import adminReducer from '../slices/adminSlice';
import vendorReducer from '../slices/vendorSlice';
import productReducer from '../slices/productSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    vendor: vendorReducer,
    product: productReducer,
  },
});

export default store;
