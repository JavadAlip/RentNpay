import express from 'express';
import {
  adminLogin,
  adminLogout,
  getAllVendors,
  createVendorProfile,
  getVendorDetails,
  getAllUsers,
  getUserDetails,
  getAllProducts,
} from '../controller/admin/adminController.js';
import {
  getVendorKycQueue,
  getVendorKycReview,
  reviewVendorKyc,
} from '../controller/admin/kycController.js';
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
import upload from '../middleware/upload.js';

// Admin auth
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);

router.post(
  '/create-category',
  adminAuth,
  upload.single('image'),
  createCategory,
);
router.get('/get-categories', getCategories);
router.delete('/delete-category/:id', adminAuth, deleteCategory);

router.post(
  '/create-sub-category',
  adminAuth,
  upload.single('image'),
  createSubCategory,
);
router.get('/get-sub-categories/:categoryId', adminAuth, getSubCategories);
router.delete('/delete-sub-category/:id', adminAuth, deleteSubCategory);

router.get('/get-vendors', adminAuth, getAllVendors);
router.post('/create-vendor', adminAuth, createVendorProfile);
router.get('/get-vendors/:id', adminAuth, getVendorDetails);
router.get('/get-users', adminAuth, getAllUsers);
router.get('/get-users/:id', adminAuth, getUserDetails);
router.get('/products', getAllProducts);

// Vendor KYC approvals
router.get('/kyc/queue', adminAuth, getVendorKycQueue);
router.get('/kyc/:vendorId', adminAuth, getVendorKycReview);
router.put('/kyc/:vendorId', adminAuth, reviewVendorKyc);

export default router;
