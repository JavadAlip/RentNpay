import express from 'express';
import {
  signupUser,
  verifyUserOTP,
  loginUser,
  userLogout,
} from '../controller/user/userController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// auth
router.post('/user-signup', signupUser);
router.post('/user-verify-otp', verifyUserOTP);
router.post('/user-login', loginUser);
router.post('/user-logout', userAuth, userLogout);

export default router;
