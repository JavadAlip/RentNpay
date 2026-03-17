// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { apiAdminLogin, apiAdminLogout } from '../service/api';

// // Admin Login
// export const adminLogin = createAsyncThunk(
//   'admin/login',
//   async (loginData, { rejectWithValue }) => {
//     try {
//       const response = await apiAdminLogin(loginData);

//       // Save token & user
//       localStorage.setItem('adminToken', response.data.token);
//       localStorage.setItem('adminUser', JSON.stringify(response.data.user));

//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Login failed');
//     }
//   }
// );

// // Admin Logout
// export const adminLogout = createAsyncThunk(
//   'admin/logout',
//   async (_, { rejectWithValue }) => {
//     try {
//       await apiAdminLogout();
//       localStorage.removeItem('adminToken');
//       localStorage.removeItem('adminUser');
//       return true;
//     } catch (error) {
//       return rejectWithValue('Logout failed');
//     }
//   }
// );

// const initialState = {
//   isAuthenticated: !!localStorage.getItem('adminToken'),
//   token: localStorage.getItem('adminToken') || null,
//   user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
//   loading: false,
//   error: null,
// };

// const adminSlice = createSlice({
//   name: 'admin',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(adminLogin.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(adminLogin.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.token = action.payload.token;
//         state.user = action.payload.user; // ✅ Store user in Redux
//         state.error = null;
//       })
//       .addCase(adminLogin.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.token = null;
//         state.user = null;
//         state.error = action.payload;
//       })
//       .addCase(adminLogout.fulfilled, (state) => {
//         state.isAuthenticated = false;
//         state.token = null;
//         state.user = null;
//         state.error = null;
//       });
//   },
// });

// export const { clearError } = adminSlice.actions;
// export default adminSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiAdminLogin } from '../service/api';

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

// Logout (no need to call backend unless session exists server-side)
export const adminLogout = createAsyncThunk('admin/logout', async () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  return true;
});

const initialState = {
  isAuthenticated: !!localStorage.getItem('adminToken'),
  token: localStorage.getItem('adminToken') || null,
  user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  loading: false,
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
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
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
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
