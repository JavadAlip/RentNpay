import express from 'express';
import {
  brevoTestLogin,
  brevoTestMe,
  brevoTestRegister,
  brevoTestVerifyOtp,
} from '../controller/vendor/brevoTestController.js';

const router = express.Router();

router.post('/register', brevoTestRegister);
router.post('/verify-otp', brevoTestVerifyOtp);
router.post('/login', brevoTestLogin);
router.get('/me', brevoTestMe);

export default router;
