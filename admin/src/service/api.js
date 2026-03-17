import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ✅ FIXED
export const apiAdminLogin = (loginData) =>
  API.post('/admin/admin-login', loginData);

export const apiAdminLogout = () => API.post('/admin/admin-logout');

export default API;
