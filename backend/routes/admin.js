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
  getMasterCategories,
} from '../controller/admin/categoryController.js';
import {
  createSubCategory,
  getSubCategories,
  deleteSubCategory,
} from '../controller/admin/subCategoryController.js';
import {
  listListingTemplates,
  getListingTemplate,
  createListingTemplate,
  updateListingTemplate,
  deleteListingTemplate,
  patchListingTemplateActive,
} from '../controller/admin/listingTemplateController.js';
import { getWishlistAnalytics } from '../controller/admin/wishlistController.js';
import { adminAuth } from '../middleware/Auth.js';
const router = express.Router();
import upload from '../middleware/upload.js';

// Admin auth
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);

router.post(
  '/create-category',
  adminAuth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
  ]),
  createCategory,
);
router.get('/get-categories', getCategories);
router.get('/master-categories', adminAuth, getMasterCategories);
router.delete('/delete-category/:id', adminAuth, deleteCategory);

router.post(
  '/create-sub-category',
  adminAuth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
  ]),
  createSubCategory,
);
router.get('/get-sub-categories/:categoryId', adminAuth, getSubCategories);
router.delete('/delete-sub-category/:id', adminAuth, deleteSubCategory);

router.get('/listing-templates', adminAuth, listListingTemplates);
router.get('/listing-templates/:id', adminAuth, getListingTemplate);
router.post(
  '/listing-templates',
  adminAuth,
  upload.any(),
  createListingTemplate,
);
router.put(
  '/listing-templates/:id',
  adminAuth,
  upload.any(),
  updateListingTemplate,
);
router.delete('/listing-templates/:id', adminAuth, deleteListingTemplate);
router.patch(
  '/listing-templates/:id/active',
  adminAuth,
  patchListingTemplateActive,
);

router.get('/get-vendors', adminAuth, getAllVendors);
router.post('/create-vendor', adminAuth, createVendorProfile);
router.get('/get-vendors/:id', adminAuth, getVendorDetails);
router.get('/get-users', adminAuth, getAllUsers);
router.get('/get-users/:id', adminAuth, getUserDetails);
router.get('/products', getAllProducts);
router.get('/wishlist/analytics', adminAuth, getWishlistAnalytics);

// Vendor KYC approvals
router.get('/kyc/queue', adminAuth, getVendorKycQueue);
router.get('/kyc/:vendorId', adminAuth, getVendorKycReview);
router.put('/kyc/:vendorId', adminAuth, reviewVendorKyc);

export default router;
