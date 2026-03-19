import express from 'express';
import {
  adminLogin,
  adminLogout,
} from '../controller/admin/adminController.js';
import {
  createCategory,
  getCategories,
} from '../controller/admin/categoryController.js';
import {
  createSubCategory,
  getSubCategories,
} from '../controller/admin/subCategoryController.js';
const router = express.Router();

// Admin auth
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);

router.post('/create-category', createCategory);
router.get('/get-categories', getCategories);

router.post('/create-sub-category', createSubCategory);
router.get('/get-sub-categories/:categoryId', getSubCategories);

export default router;
