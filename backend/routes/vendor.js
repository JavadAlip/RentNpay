import express from 'express';
import upload from '../middleware/upload.js';
import { vendorAuth } from '../middleware/vendorAuth.js';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductById,
} from '../controller/vendor/productController.js';
import { getVendorCustomersSummary } from '../controller/vendor/customerController.js';
import {
  deleteVendorOffer,
  getPublicActiveOffers,
  getVendorOffers,
  upsertVendorOffer,
} from '../controller/vendor/offerController.js';
import { getMyKyc, submitMyKyc } from '../controller/vendor/kycController.js';
import {
  signupVendor,
  verifyOTP,
  loginVendor,
  vendorLogout,
  getAllVendors,
  deleteVendor,
} from '../controller/vendor/vendorController.js';

const router = express.Router();

// auth
router.post('/vendor-signup', signupVendor);
router.post('/verify-otp', verifyOTP);
router.post('/vendor-login', loginVendor);
router.post('/vendor-logout', vendorAuth, vendorLogout);
router.get('/all-vendors', getAllVendors);
router.delete('/delete-vendor/:id', deleteVendor);

// product
// Create
router.post(
  '/create-product',
  vendorAuth,
  upload.single('image'),
  createProduct,
);

// Get My Products
router.get('/my-products', vendorAuth, getMyProducts);

// Update
router.put(
  '/update-product/:id',
  vendorAuth,
  upload.single('image'),
  updateProduct,
);

// Delete
router.delete('/delete-product/:id', vendorAuth, deleteProduct);
router.get('/product/:id', getProductById);
router.get('/customers', vendorAuth, getVendorCustomersSummary);
router.get('/kyc', vendorAuth, getMyKyc);
router.post(
  '/kyc',
  vendorAuth,
  upload.fields([
    { name: 'ownerPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
  ]),
  submitMyKyc,
);

// offers
router.get('/offers/public-active', getPublicActiveOffers);
router.get('/offers', vendorAuth, getVendorOffers);
router.post('/offers', vendorAuth, upsertVendorOffer);
router.delete('/offers/:id', vendorAuth, deleteVendorOffer);

export default router;
