import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiAdminLogin,
  apiGetAllUsers,
  apiGetAllVendors,
} from '../../service/api';

// Login
export const adminLogin = createAsyncThunk(
  'admin/login',
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await apiAdminLogin(loginData);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);
export const getAllVendors = createAsyncThunk(
  'admin/getVendors',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) {
        return rejectWithValue('Please login again to continue.');
      }
      const res = await apiGetAllVendors(token);
      return res.data.vendors;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get vendors',
      );
    }
  },
);

export const getAllUsers = createAsyncThunk(
  'admin/getUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token =
        getState().admin.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('adminToken')
          : null);
      if (!token) {
        return rejectWithValue('Please login again to continue.');
      }
      const res = await apiGetAllUsers(token);
      return res.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get users');
    }
  },
);

// Logout (no need to call backend unless session exists server-side)
export const adminLogout = createAsyncThunk('admin/logout', async () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  return true;
});

function readAdminAuthFromStorage() {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, token: null, user: null };
  }
  const token = localStorage.getItem('adminToken');
  return {
    isAuthenticated: !!token,
    token,
    user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  };
}

const initialState = {
  ...readAdminAuthFromStorage(),
  vendors: [],
  users: [],
  usersLoading: false,
  vendorsLoading: false,
  authLoading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.authLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.authLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      .addCase(getAllVendors.pending, (state) => {
        state.vendorsLoading = true;
        state.error = null;
      })
      .addCase(getAllVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.vendors = action.payload;
      })
      .addCase(getAllVendors.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.error = action.payload;
      })
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
