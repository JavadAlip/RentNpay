import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiVendorSignup,
  apiVendorVerifyOtp,
  apiVendorLogin,
} from '../../service/api';

// ── Signup ──────────────────────────────────────────────────────────────────
export const vendorSignup = createAsyncThunk(
  'vendor/signup',
  async (signupData, { rejectWithValue }) => {
    try {
      const response = await apiVendorSignup(signupData);
      // Store email so OTP screen can use it without prop-drilling
      localStorage.setItem('vendorPendingEmail', signupData.emailAddress);
      return response.data; // { message: 'Signup successful, OTP sent to email' }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  },
);

// ── Verify OTP ───────────────────────────────────────────────────────────────
export const vendorVerifyOtp = createAsyncThunk(
  'vendor/verifyOtp',
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await apiVendorVerifyOtp(otpData);
      localStorage.removeItem('vendorPendingEmail');
      return response.data; // { message: 'Account verified successfully' }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'OTP verification failed',
      );
    }
  },
);

// ── Login ────────────────────────────────────────────────────────────────────
export const vendorLogin = createAsyncThunk(
  'vendor/login',
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await apiVendorLogin(loginData);
      localStorage.setItem('vendorToken', response.data.token);
      localStorage.setItem('vendorUser', JSON.stringify(response.data.vendor));
      return response.data; // { message, token, vendor: { id, fullName, emailAddress } }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

// ── Logout ───────────────────────────────────────────────────────────────────
export const vendorLogout = createAsyncThunk('vendor/logout', async () => {
  localStorage.removeItem('vendorToken');
  localStorage.removeItem('vendorUser');
  localStorage.removeItem('vendorPendingEmail');
  return true;
});

// ── Initial state ─────────────────────────────────────────────────────────────
function readVendorAuthFromStorage() {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      token: null,
      user: null,
      pendingEmail: null,
    };
  }
  const token = localStorage.getItem('vendorToken');
  return {
    isAuthenticated: !!token,
    token,
    user: JSON.parse(localStorage.getItem('vendorUser') || 'null'),
    pendingEmail: localStorage.getItem('vendorPendingEmail') || null,
  };
}

const initialState = {
  ...readVendorAuthFromStorage(),
  otpVerified: false,
  loading: false,
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOtpVerified: (state) => {
      state.otpVerified = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Signup ──
      .addCase(vendorSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(vendorSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingEmail =
          typeof window !== 'undefined'
            ? localStorage.getItem('vendorPendingEmail')
            : null;
      })
      .addCase(vendorSignup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Verify OTP ──
      .addCase(vendorVerifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(vendorVerifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpVerified = true;
        state.pendingEmail = null;
      })
      .addCase(vendorVerifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Login ──
      .addCase(vendorLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(vendorLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.vendor;
      })
      .addCase(vendorLogin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // ── Logout ──
      .addCase(vendorLogout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.pendingEmail = null;
        state.otpVerified = false;
        state.error = null;
      });
  },
});

export const { clearError, clearOtpVerified } = vendorSlice.actions;
export default vendorSlice.reducer;
