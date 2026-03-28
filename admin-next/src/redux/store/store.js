import { configureStore } from '@reduxjs/toolkit';
import adminReducer from '../slices/adminSlice';
import vendorReducer from '../slices/vendorSlice';
import productReducer from '../slices/productSlice';
import categoryReducer from '../slices/categorySlice';
import listingTemplateReducer from '../slices/listingTemplateSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    vendor: vendorReducer,
    product: productReducer,
    category: categoryReducer,
    listingTemplate: listingTemplateReducer,
  },
});

export default store;
