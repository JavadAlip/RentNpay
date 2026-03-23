// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Persist token to localStorage so it survives page refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem('userToken', action.payload.token);
        localStorage.setItem('userData', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
    },
    // Call this on app boot to rehydrate from localStorage
    rehydrateAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('userToken');
        const user = localStorage.getItem('userData');
        if (token && user) {
          state.token = token;
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
        }
      }
    },
  },
});

export const { setCredentials, logout, rehydrateAuth } = authSlice.actions;
export default authSlice.reducer;
