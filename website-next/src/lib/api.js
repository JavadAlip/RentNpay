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
/** Admin product list (all vendor inventory rows; optional filters). */
export const apiGetAllProducts = (queryString = '') =>
  api.get(`/admin/products${queryString ? `?${queryString}` : ''}`);

/**
 * Storefront: same `Product` documents vendors create in the vendor dashboard
 * (`/vendor/my-products`). Passes `storefront=1` so drafts / pending approval are hidden.
 */
export const apiGetStorefrontVendorProducts = (queryString = '') =>
  api.get(
    `/admin/products?storefront=1${queryString ? `&${queryString}` : ''}`,
  );

export const apiGetProductById = (id) => api.get(`/vendor/product/${id}`);
export const apiGetPublicActiveOffers = () => api.get('/vendor/offers/public-active');

// ── USER ADDRESSES ────────────────────────────
export const apiGetMyAddresses = () => api.get('/users/addresses');
export const apiCreateAddress = (data) => api.post('/users/addresses', data);
export const apiUpdateAddress = (id, data) => api.put(`/users/addresses/${id}`, data);
export const apiDeleteAddress = (id) => api.delete(`/users/addresses/${id}`);
export const apiGetMyUserKyc = () => api.get('/users/kyc');
export const apiSubmitMyUserKyc = (formData) =>
  api.post('/users/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── USER ORDERS ───────────────────────────────
export const apiCreateOrder = (data) => api.post('/orders', data);
export const apiGetMyOrders = () => api.get('/orders/my');

// ── WISHLIST ────────────────────────────────
export const apiGetMyWishlist = () => api.get('/users/wishlist');
export const apiToggleWishlist = (productId) =>
  api.post('/users/wishlist/toggle', { productId });
