import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('rentpay_token');
const userStr = localStorage.getItem('rentpay_user');

const initialState = {
  user: userStr ? JSON.parse(userStr) : null,
  token: token || null,
  isAuthenticated: !!token
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user || payload;
      state.token = payload.token;
      state.isAuthenticated = !!payload.token;
      if (payload.token) localStorage.setItem('rentpay_token', payload.token);
      if (payload.user) localStorage.setItem('rentpay_user', JSON.stringify(payload.user));
      else if (payload.name) localStorage.setItem('rentpay_user', JSON.stringify(payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('rentpay_token');
      localStorage.removeItem('rentpay_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
