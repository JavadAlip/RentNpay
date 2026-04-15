import express from 'express';
import upload from '../middleware/upload.js';
import { vendorAuth } from '../middleware/vendorAuth.js';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getMarketLowRentalTenures,
} from '../controller/vendor/productController.js';
import {
  getListingTemplateForVendor,
  listListingTemplatesForVendor,
} from '../controller/vendor/listingTemplateBrowseController.js';
import { getVendorCustomersSummary } from '../controller/vendor/customerController.js';
import {
  deleteVendorOffer,
  getPublicActiveOffers,
  getVendorOffers,
  upsertVendorOffer,
} from '../controller/vendor/offerController.js';
import { getMyKyc, submitMyKyc } from '../controller/vendor/kycController.js';
import { getVendorNotifications } from '../controller/vendor/notificationController.js';
import {
  getVendorOrders,
  getVendorOrderById,
  getVendorOrderPackDetail,
  vendorMarkOrderShipped,
  updateVendorOrderStatus,
  scheduleVendorReturnPickup,
  completeVendorReturnInspection,
} from '../controller/vendor/orderController.js';
import {
  signupVendor,
  verifyOTP,
  loginVendor,
  forgotVendorPassword,
  verifyVendorResetOtp,
  resetVendorPassword,
  vendorLogout,
  getAllVendors,
  deleteVendor,
} from '../controller/vendor/vendorController.js';

const router = express.Router();

// auth
router.post('/vendor-signup', signupVendor);
router.post('/verify-otp', verifyOTP);
router.post('/vendor-login', loginVendor);
router.post('/forgot-password', forgotVendorPassword);
router.post('/verify-reset-otp', verifyVendorResetOtp);
router.post('/reset-password', resetVendorPassword);
router.post('/vendor-logout', vendorAuth, vendorLogout);
router.get('/all-vendors', getAllVendors);
router.delete('/delete-vendor/:id', deleteVendor);

// product
// Create
router.post(
  '/create-product',
  vendorAuth,
  upload.array('images', 5),
  createProduct,
);

// Get My Products
router.get('/my-products', vendorAuth, getMyProducts);

// Lowest per-tenure rates (other vendors) — manual listing “Market low”
router.get('/market-low-rental-tenures', vendorAuth, getMarketLowRentalTenures);

// Browse admin listing templates (active only) — for “Add from standard catalog”
router.get('/listing-templates', vendorAuth, listListingTemplatesForVendor);
router.get('/listing-templates/:id', vendorAuth, getListingTemplateForVendor);

// Update
router.put(
  '/update-product/:id',
  vendorAuth,
  upload.array('images', 5),
  updateProduct,
);

// Delete
router.delete('/delete-product/:id', vendorAuth, deleteProduct);
router.get('/product/:id', getProductById);
router.get('/customers', vendorAuth, getVendorCustomersSummary);
router.get('/orders', vendorAuth, getVendorOrders);
router.get('/orders/:id/pack', vendorAuth, getVendorOrderPackDetail);
router.put('/orders/:id/mark-shipped', vendorAuth, vendorMarkOrderShipped);
router.get('/orders/:id', vendorAuth, getVendorOrderById);
router.put('/orders/:id/status', vendorAuth, updateVendorOrderStatus);
router.put(
  '/orders/:id/return-pickup',
  vendorAuth,
  scheduleVendorReturnPickup,
);
router.put(
  '/orders/:id/return-inspection',
  vendorAuth,
  completeVendorReturnInspection,
);
router.get('/kyc', vendorAuth, getMyKyc);
router.get('/notifications', vendorAuth, getVendorNotifications);
router.post(
  '/kyc',
  vendorAuth,
  upload.any(),
  submitMyKyc,
);

// offers
router.get('/offers/public-active', getPublicActiveOffers);
router.get('/offers', vendorAuth, getVendorOffers);
router.post('/offers', vendorAuth, upsertVendorOffer);
router.delete('/offers/:id', vendorAuth, deleteVendorOffer);

export default router;
