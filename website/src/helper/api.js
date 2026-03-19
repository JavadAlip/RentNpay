import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Get Categories
export const apiGetCategories = () => API.get('/admin/get-categories');

// ✅ Fix this
export const apiGetAllProducts = (queryString = '') =>
  API.get(`/admin/products${queryString ? `?${queryString}` : ''}`);

// ── SUBCATEGORY APIs ─────────────────────────

export const apiGetSubCategories = (categoryId, token) =>
  API.get(`/admin/get-sub-categories/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export default API;

// Ge
