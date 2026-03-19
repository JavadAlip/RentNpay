import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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

export default API;
