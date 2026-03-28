import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiGetListingTemplates,
  apiCreateListingTemplate,
  apiUpdateListingTemplate,
  apiDeleteListingTemplate,
  apiPatchListingTemplateActive,
} from '../../service/api';

const authToken = (getState) =>
  getState().admin.token ||
  (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);

export const fetchListingTemplates = createAsyncThunk(
  'listingTemplate/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = authToken(getState);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiGetListingTemplates(token);
      return res.data.listingTemplates || [];
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || 'Failed to load listing templates',
      );
    }
  },
);

export const createListingTemplate = createAsyncThunk(
  'listingTemplate/create',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = authToken(getState);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiCreateListingTemplate(formData, token);
      return res.data.listingTemplate;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || 'Failed to create listing template',
      );
    }
  },
);

export const updateListingTemplate = createAsyncThunk(
  'listingTemplate/update',
  async ({ id, formData }, { getState, rejectWithValue }) => {
    try {
      const token = authToken(getState);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiUpdateListingTemplate(id, formData, token);
      return res.data.listingTemplate;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || 'Failed to update listing template',
      );
    }
  },
);

export const deleteListingTemplate = createAsyncThunk(
  'listingTemplate/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = authToken(getState);
      if (!token) return rejectWithValue('Please login again to continue.');
      await apiDeleteListingTemplate(id, token);
      return id;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || 'Failed to delete listing template',
      );
    }
  },
);

export const toggleListingTemplateActive = createAsyncThunk(
  'listingTemplate/toggleActive',
  async ({ id, isActive }, { getState, rejectWithValue }) => {
    try {
      const token = authToken(getState);
      if (!token) return rejectWithValue('Please login again to continue.');
      const res = await apiPatchListingTemplateActive(id, isActive, token);
      return res.data.listingTemplate;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || 'Failed to update status',
      );
    }
  },
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const listingTemplateSlice = createSlice({
  name: 'listingTemplate',
  initialState,
  reducers: {
    clearListingTemplateError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListingTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListingTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchListingTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createListingTemplate.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateListingTemplate.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (x) => x._id === action.payload._id,
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteListingTemplate.fulfilled, (state, action) => {
        state.items = state.items.filter((x) => x._id !== action.payload);
      })
      .addCase(toggleListingTemplateActive.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (x) => x._id === action.payload._id,
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(createListingTemplate.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateListingTemplate.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteListingTemplate.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(toggleListingTemplateActive.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearListingTemplateError } = listingTemplateSlice.actions;
export default listingTemplateSlice.reducer;
