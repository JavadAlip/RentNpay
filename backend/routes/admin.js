import express from 'express';
import {
  adminLogin,
  adminLogout,
} from '../controller/admin/adminController.js';
import {
  createCategory,
  getCategories,
  deleteCategory,
} from '../controller/admin/categoryController.js';
import {
  createSubCategory,
  getSubCategories,
  deleteSubCategory,
} from '../controller/admin/subCategoryController.js';
import { adminAuth } from '../middleware/Auth.js';
const router = express.Router();

// Admin auth
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);

router.post('/create-category', adminAuth, createCategory);
router.get('/get-categories', adminAuth, getCategories);
router.delete('/delete-category/:id', adminAuth, deleteCategory);

router.post('/create-sub-category', adminAuth, createSubCategory);
router.get('/get-sub-categories/:categoryId', adminAuth, getSubCategories);
router.delete('/delete-sub-category/:id', adminAuth, deleteSubCategory);

export default router;
