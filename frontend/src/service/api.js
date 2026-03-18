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

export default API;
