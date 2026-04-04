import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

// admin auth
export const apiAdminLogin = (loginData) =>
  API.post('/admin/admin-login', loginData);

export const apiAdminLogout = () => API.post('/admin/admin-logout');

//vendor auth
export const apiVendorSignup = (data) =>
  API.post('/vendor/vendor-signup', data);

export const apiVendorVerifyOtp = (data) =>
  API.post('/vendor/verify-otp', data);

export const apiVendorLogin = (data) => API.post('/vendor/vendor-login', data);
export const apiVendorForgotPassword = (data) =>
  API.post('/vendor/forgot-password', data);
export const apiVendorVerifyResetOtp = (data) =>
  API.post('/vendor/verify-reset-otp', data);
export const apiVendorResetPassword = (data) =>
  API.post('/vendor/reset-password', data);

// vendor kyc
export const apiGetMyVendorKyc = (token) =>
  API.get('/vendor/kyc', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorNotifications = (token) =>
  API.get('/vendor/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiSubmitVendorKyc = (data, token) =>
  API.post('/vendor/kyc', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

// ── PRODUCT APIs ─────────────────────────────────────────

// Create Product
export const apiCreateProduct = (data, token) =>
  API.post('/vendor/create-product', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

// Get My Products
export const apiGetMyProducts = (token) =>
  API.get('/vendor/my-products', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/** Per-tenure market lows (₹/month or ₹/day) excluding current vendor — manual product modal. */
export const apiGetVendorMarketLowRentalTenures = (params, token) =>
  API.get('/vendor/market-low-rental-tenures', {
    params: params || {},
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Vendor Customers summary
export const apiGetVendorCustomers = (token) =>
  API.get('/vendor/customers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorOrders = (token) =>
  API.get('/vendor/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorOrder = (id, token) =>
  API.get(`/vendor/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorOrderPack = (id, token) =>
  API.get(`/vendor/orders/${id}/pack`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiVendorMarkOrderShipped = (id, body, token) =>
  API.put(`/vendor/orders/${id}/mark-shipped`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiUpdateVendorOrderStatus = (id, status, token) =>
  API.put(
    `/vendor/orders/${id}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

// Vendor Offers
export const apiGetVendorOffers = (token) =>
  API.get('/vendor/offers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiUpsertVendorOffer = (data, token) =>
  API.post('/vendor/offers', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiDeleteVendorOffer = (id, token) =>
  API.delete(`/vendor/offers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Update Product
export const apiUpdateProduct = (id, data, token) =>
  API.put(`/vendor/update-product/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

// Delete Product
export const apiDeleteProduct = (id, token) =>
  API.delete(`/vendor/delete-product/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/** Active admin listing templates (vendor catalog — clone into vendor Product). */
export const apiGetVendorListingTemplates = (token, params = {}) =>
  API.get('/vendor/listing-templates', {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorListingTemplate = (id, token) =>
  API.get(`/vendor/listing-templates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ── CATEGORY APIs ─────────────────────────

// Create Category
export const apiCreateCategory = (data, token) =>
  API.post('/admin/create-category', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Get Categories
export const apiGetCategories = () => API.get('/admin/get-categories');

// Master category tree + stats (admin)
export const apiGetMasterCategories = (token, platform = 'rent') =>
  API.get(`/admin/master-categories?platform=${encodeURIComponent(platform)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Delete Category
export const apiDeleteCategory = (id, token) =>
  API.delete(`/admin/delete-category/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ── SUBCATEGORY APIs ─────────────────────────

// Create SubCategory
export const apiCreateSubCategory = (data, token) =>
  API.post('/admin/create-sub-category', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Get SubCategories
export const apiGetSubCategories = (categoryId, token) =>
  API.get(`/admin/get-sub-categories/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Delete SubCategory
export const apiDeleteSubCategory = (id, token) =>
  API.delete(`/admin/delete-sub-category/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ── ADMIN LISTING TEMPLATES (Custom Listings) ─────────────────────────

export const apiGetListingTemplates = (token) =>
  API.get('/admin/listing-templates', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiCreateListingTemplate = (data, token) =>
  API.post('/admin/listing-templates', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiUpdateListingTemplate = (id, data, token) =>
  API.put(`/admin/listing-templates/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiDeleteListingTemplate = (id, token) =>
  API.delete(`/admin/listing-templates/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiPatchListingTemplateActive = (id, isActive, token) =>
  API.patch(
    `/admin/listing-templates/${id}/active`,
    { isActive },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

// ── ADMIN VENDOR APIs ─────────────────────────

// Get All Vendors
export const apiGetAllVendors = (token) =>
  API.get('/admin/get-vendors', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiCreateVendorProfile = (data, token) =>
  API.post('/admin/create-vendor', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

export const apiGetAdminVendorDetails = (id, token) =>
  API.get(`/admin/get-vendors/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/** Full vendor KYC payload (same source as KYC review page) — useful fallback for document URLs. */
export const apiGetAdminVendorKycReview = (vendorId, token) =>
  API.get(`/admin/kyc/${vendorId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Get All Users
export const apiGetAllUsers = (token) =>
  API.get('/admin/get-users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetAdminUserDetails = (id, token) =>
  API.get(`/admin/get-users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Get All Products (admin)
export const apiGetAllAdminProducts = (token, query = '') =>
  API.get(`/admin/products${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ── ADMIN ORDER APIs ─────────────────────────
export const apiGetAllOrders = (token) =>
  API.get('/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiUpdateOrderStatus = (id, status, token) =>
  API.put(
    `/orders/${id}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

// ── ADMIN WISHLIST ANALYTICS ─────────────────
export const apiGetWishlistAnalytics = (token) =>
  API.get('/admin/wishlist/analytics', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ── VENDOR KYC APIs ─────────────────────────────────────────────
export const apiGetVendorKycQueue = (token) =>
  API.get('/admin/kyc/queue', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetVendorKycReview = (vendorId, token) =>
  API.get(`/admin/kyc/${vendorId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiReviewVendorKyc = (vendorId, payload, token) =>
  API.put(`/admin/kyc/${vendorId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

export const apiRequestVendorKycDocumentReupload = (vendorId, body, token) =>
  API.post(`/admin/kyc/${vendorId}/request-reupload`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

// ── CUSTOMER KYC APIs ───────────────────────────────────────────
export const apiGetCustomerKycQueue = (token) =>
  API.get('/admin/kyc/customer/queue', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiGetCustomerKycReview = (userId, token) =>
  API.get(`/admin/kyc/customer/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const apiReviewCustomerKyc = (userId, payload, token) =>
  API.put(`/admin/kyc/customer/${userId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

export default API;
