import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiCreateCategory,
  apiGetCategories,
  apiDeleteCategory,
  apiCreateSubCategory,
  apiGetSubCategories,
  apiDeleteSubCategory,
} from '../../service/api';

// ── CATEGORY ─────────────────────────

// Create Category
export const createCategory = createAsyncThunk(
  'category/create',
  async (data, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      const res = await apiCreateCategory(data, token);
      return res.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// Get Categories
export const getCategories = createAsyncThunk(
  'category/getAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      const res = await apiGetCategories(token);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// Delete Category
export const deleteCategory = createAsyncThunk(
  'category/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      await apiDeleteCategory(id, token);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── SUBCATEGORY ─────────────────────────

// Create SubCategory
export const createSubCategory = createAsyncThunk(
  'subcategory/create',
  async (data, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      const res = await apiCreateSubCategory(data, token);
      return res.data.subCategory;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// Get SubCategories
export const getSubCategories = createAsyncThunk(
  'subcategory/get',
  async (categoryId, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      const res = await apiGetSubCategories(categoryId, token);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// Delete SubCategory
export const deleteSubCategory = createAsyncThunk(
  'subcategory/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().admin.token;
      await apiDeleteSubCategory(id, token);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// ── INITIAL STATE ─────────────────────────
const initialState = {
  categories: [],
  subCategories: [],
  loading: false,
  error: null,
};

// ── SLICE ─────────────────────────
const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // CATEGORY
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.unshift(action.payload);
      })

      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })

      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload,
        );
      })

      // SUBCATEGORY
      .addCase(createSubCategory.fulfilled, (state, action) => {
        state.subCategories.unshift(action.payload);
      })

      .addCase(getSubCategories.fulfilled, (state, action) => {
        state.subCategories = action.payload;
      })

      .addCase(deleteSubCategory.fulfilled, (state, action) => {
        state.subCategories = state.subCategories.filter(
          (s) => s._id !== action.payload,
        );
      });
  },
});

export default categorySlice.reducer;
