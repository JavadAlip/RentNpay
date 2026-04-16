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
  {
    let locationPart = '';
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('rn_delivery_location');
        const parsed = raw ? JSON.parse(raw) : null;
        const lat = Number(parsed?.lat);
        const lon = Number(parsed?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          locationPart = `&userLat=${encodeURIComponent(lat)}&userLng=${encodeURIComponent(lon)}`;
        }
      } catch {
        /* ignore local parse errors */
      }
    }
    return api.get(
      `/admin/products?storefront=1${queryString ? `&${queryString}` : ''}${locationPart}`,
    );
  };

/** Buy page hero: total sell listings + Brand New / Refurbished counts (full catalog, not paginated). */
export const apiGetStorefrontSellStats = () =>
  api.get('/admin/products?storefront=1&sellStats=1');

export const apiGetProductById = (id) => api.get(`/vendor/product/${id}`);
export const apiGetPublicActiveOffers = () => api.get('/vendor/offers/public-active');

// ── USER ADDRESSES ────────────────────────────
export const apiGetMyAddresses = () => api.get('/users/addresses');
export const apiGetCheckoutPickupStores = (productIds = [], opts = {}) => {
  let userLat = opts?.userLat;
  let userLng = opts?.userLng;
  if (
    !Number.isFinite(Number(userLat)) ||
    !Number.isFinite(Number(userLng))
  ) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('rn_delivery_location');
        const parsed = raw ? JSON.parse(raw) : null;
        userLat = Number(parsed?.lat);
        userLng = Number(parsed?.lon);
      } catch {
        userLat = undefined;
        userLng = undefined;
      }
    }
  }
  const params = {
    productIds: Array.isArray(productIds) ? productIds.join(',') : '',
  };
  if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
    params.userLat = Number(userLat);
    params.userLng = Number(userLng);
  }
  return api.get('/users/checkout-pickup-stores', { params });
};
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
export const apiGetMyOrderById = (id) => api.get(`/orders/my/${id}`);
export const apiCancelMyOrder = (id) => api.put(`/orders/my/${id}/cancel`);
export const apiExtendMyOrderTenure = (id, data) =>
  api.put(`/orders/my/${id}/extend`, data);
export const apiSubmitMyReturnRequest = (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return api.put(`/orders/my/${id}/return-request`, data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};
export const apiSubmitMyIssueReport = (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return api.put(`/orders/my/${id}/report-issue`, data, isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined);
};

// ── USER NOTIFICATIONS ───────────────────────
export const apiGetUserNotifications = () => api.get('/users/notifications');

// ── WISHLIST ────────────────────────────────
export const apiGetMyWishlist = () => api.get('/users/wishlist');
export const apiToggleWishlist = (productId) =>
  api.post('/users/wishlist/toggle', { productId });
