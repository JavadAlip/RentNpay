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
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiCreateCategory(data, token);
      return res.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create category',
      );
    }
  },
);

// Get Categories
export const getCategories = createAsyncThunk(
  'category/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetCategories();
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get categories',
      );
    }
  },
);

// Delete Category
export const deleteCategory = createAsyncThunk(
  'category/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiDeleteCategory(id, token);
      return {
        id,
        deletedProducts: res.data?.deletedProducts ?? 0,
        deletedOffers: res.data?.deletedOffers ?? 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete category',
      );
    }
  },
);

// ── SUBCATEGORY ─────────────────────────

// Create SubCategory
export const createSubCategory = createAsyncThunk(
  'subcategory/create',
  async (data, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiCreateSubCategory(data, token);
      return res.data.subCategory;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create subcategory',
      );
    }
  },
);

// Get SubCategories
export const getSubCategories = createAsyncThunk(
  'subcategory/get',
  async (categoryId, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      const res = await apiGetSubCategories(categoryId, token || null);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get subcategories',
      );
    }
  },
);

// Delete SubCategory
export const deleteSubCategory = createAsyncThunk(
  'subcategory/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiDeleteSubCategory(id, token);
      return {
        id,
        deletedProducts: res.data?.deletedProducts ?? 0,
        deletedOffers: res.data?.deletedOffers ?? 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete subcategory',
      );
    }
  },
);

// ── INITIAL STATE ─────────────────────────
const initialState = {
  categories: [],
  subCategories: [],
  categoriesLoading: false,
  subCategoriesLoading: false,
  error: null,
};

// ── SLICE ─────────────────────────
const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.error = null;
      })
      // CATEGORY
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.unshift(action.payload);
      })

      .addCase(getCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload.id,
        );
      })

      // SUBCATEGORY
      .addCase(createSubCategory.fulfilled, (state, action) => {
        state.subCategories.unshift(action.payload);
      })

      .addCase(getSubCategories.pending, (state) => {
        state.subCategoriesLoading = true;
        state.error = null;
      })
      .addCase(getSubCategories.fulfilled, (state, action) => {
        state.subCategoriesLoading = false;
        state.subCategories = action.payload;
      })
      .addCase(getSubCategories.rejected, (state, action) => {
        state.subCategoriesLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteSubCategory.fulfilled, (state, action) => {
        state.subCategories = state.subCategories.filter(
          (s) => s._id !== action.payload.id,
        );
      });
  },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
