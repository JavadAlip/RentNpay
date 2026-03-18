import express from 'express';
import {
  signupVendor,
  verifyOTP,
  loginVendor,
  vendorLogout,
} from '../controller/vendor/vendorController.js';
import { vendorAuth } from '../middleware/vendorAuth.js';

const router = express.Router();

router.post('/vednor-signup', signupVendor);
router.post('/verify-otp', verifyOTP);
router.post('/vendor-login', loginVendor);
router.post('/vendor-logout', vendorAuth, vendorLogout);

export default router;
