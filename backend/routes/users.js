import express from 'express';
import {
  signupUser,
  verifyUserOTP,
  loginUser,
  userLogout,
} from '../controller/user/userController.js';
import { userAuth } from '../middleware/userAuth.js';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controller/user/addressController.js';

const router = express.Router();

// auth
router.post('/user-signup', signupUser);
router.post('/user-verify-otp', verifyUserOTP);
router.post('/user-login', loginUser);
router.post('/user-logout', userAuth, userLogout);

// addresses
router.get('/addresses', userAuth, getMyAddresses);
router.post('/addresses', userAuth, createAddress);
router.put('/addresses/:id', userAuth, updateAddress);
router.delete('/addresses/:id', userAuth, deleteAddress);

export default router;
