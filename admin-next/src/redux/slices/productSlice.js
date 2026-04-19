import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiCreateProduct,
  apiGetMyProducts,
  apiUpdateProduct,
  apiDeleteProduct,
  apiPatchVendorProductListingVisibility,
} from '../../service/api';

// ── CREATE PRODUCT ─────────────────────────
export const createProduct = createAsyncThunk(
  'product/create',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().vendor.token;
      const res = await apiCreateProduct(formData, token);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── GET MY PRODUCTS ─────────────────────────
export const getMyProducts = createAsyncThunk(
  'product/getMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().vendor.token;
      const res = await apiGetMyProducts(token);
      return res.data.products;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── UPDATE PRODUCT ─────────────────────────
export const updateProduct = createAsyncThunk(
  'product/update',
  async ({ id, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().vendor.token;
      const res = await apiUpdateProduct(id, formData, token);
      return res.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const patchVendorListingVisibility = createAsyncThunk(
  'product/patchVendorListing',
  async ({ id, vendorListingEnabled }, { getState, rejectWithValue }) => {
    try {
      const token = getState().vendor.token;
      const res = await apiPatchVendorProductListingVisibility(
        id,
        { vendorListingEnabled },
        token,
      );
      return res.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── DELETE PRODUCT ─────────────────────────
export const deleteProduct = createAsyncThunk(
  'product/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().vendor.token;
      await apiDeleteProduct(id, token);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── INITIAL STATE ─────────────────────────
const initialState = {
  products: [],
  loading: false,
  error: null,
};

// ── SLICE ─────────────────────────
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload.product);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET
      .addCase(getMyProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(getMyProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(patchVendorListingVisibility.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })

      // DELETE
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      });
  },
});

export default productSlice.reducer;
