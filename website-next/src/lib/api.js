import { api } from './axios';

// ── CONSTANTS ─────────────────────────────────
export const USER_AUTH = {
  signup: '/users/user-signup',
  verifyOtp: '/users/user-verify-otp',
  login: '/users/user-login',
  logout: '/users/user-logout',
};

// ── NORMALIZER ────────────────────────────────
export const normalizeUserFromApi = (apiUser) => ({
  id: apiUser.id || apiUser._id,
  fullName: apiUser.fullName,
  email: apiUser.emailAddress,
});

// ── AUTH ──────────────────────────────────────
export const apiSignup = (data) => api.post(USER_AUTH.signup, data);
export const apiVerifyOtp = (data) => api.post(USER_AUTH.verifyOtp, data);
export const apiLogin = (data) => api.post(USER_AUTH.login, data);
export const apiLogout = () => api.post(USER_AUTH.logout);

// ── CATEGORIES ────────────────────────────────
export const apiGetCategories = () => api.get('/admin/get-categories');
export const apiGetSubCategories = (categoryId) =>
  api.get(`/admin/get-sub-categories/${categoryId}`);

// ── PRODUCTS ──────────────────────────────────
export const apiGetAllProducts = (queryString = '') =>
  api.get(`/admin/products${queryString ? `?${queryString}` : ''}`);

export const apiGetProductById = (id) => api.get(`/vendor/product/${id}`);

// ── USER ADDRESSES ────────────────────────────
export const apiGetMyAddresses = () => api.get('/users/addresses');
export const apiCreateAddress = (data) => api.post('/users/addresses', data);
export const apiUpdateAddress = (id, data) => api.put(`/users/addresses/${id}`, data);
export const apiDeleteAddress = (id) => api.delete(`/users/addresses/${id}`);

// ── USER ORDERS ───────────────────────────────
export const apiCreateOrder = (data) => api.post('/orders', data);
export const apiGetMyOrders = () => api.get('/orders/my');
