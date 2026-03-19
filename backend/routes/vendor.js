import express from 'express';
import upload from '../middleware/upload.js';
import { vendorAuth } from '../middleware/vendorAuth.js';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
} from '../controller/vendor/productController.js';
import {
  signupVendor,
  verifyOTP,
  loginVendor,
  vendorLogout,
} from '../controller/vendor/vendorController.js';

const router = express.Router();

// auth
router.post('/vednor-signup', signupVendor);
router.post('/verify-otp', verifyOTP);
router.post('/vendor-login', loginVendor);
router.post('/vendor-logout', vendorAuth, vendorLogout);

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

export default router;
