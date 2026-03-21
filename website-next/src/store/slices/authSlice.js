import { createSlice } from '@reduxjs/toolkit';

function readAuthFromStorage() {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }
  const token = localStorage.getItem('rentpay_token');
  const userStr = localStorage.getItem('rentpay_user');
  return {
    user: userStr ? JSON.parse(userStr) : null,
    token: token || null,
    isAuthenticated: !!token,
  };
}

const initialState = readAuthFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user || payload;
      state.token = payload.token;
      state.isAuthenticated = !!payload.token;
      if (typeof window === 'undefined') return;
      if (payload.token) localStorage.setItem('rentpay_token', payload.token);
      if (payload.user) localStorage.setItem('rentpay_user', JSON.stringify(payload.user));
      else if (payload.name) localStorage.setItem('rentpay_user', JSON.stringify(payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rentpay_token');
        localStorage.removeItem('rentpay_user');
      }
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
