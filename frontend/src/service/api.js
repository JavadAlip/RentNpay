import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  // baseURL: 'http://backend.delicode.com/api',
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

// ── ADMIN VENDOR APIs ─────────────────────────

// Get All Vendors
export const apiGetAllVendors = (token) =>
  API.get('/admin/get-vendors', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export default API;
