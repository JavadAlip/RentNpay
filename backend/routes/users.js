import express from 'express';
import upload from '../middleware/upload.js';
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
  getCheckoutPickupStores,
} from '../controller/user/addressController.js';
import {
  getMyWishlist,
  toggleWishlist,
} from '../controller/user/wishlistController.js';
import { getMyUserKyc, submitMyUserKyc } from '../controller/user/kycController.js';
import { getUserNotifications } from '../controller/user/notificationController.js';
import { getMySupportTickets } from '../controller/user/ticketController.js';

const router = express.Router();

// auth
router.post('/user-signup', signupUser);
router.post('/user-verify-otp', verifyUserOTP);
router.post('/user-login', loginUser);
router.post('/user-logout', userAuth, userLogout);

// addresses
router.get('/addresses', userAuth, getMyAddresses);
router.get('/checkout-pickup-stores', userAuth, getCheckoutPickupStores);
router.post('/addresses', userAuth, createAddress);
router.put('/addresses/:id', userAuth, updateAddress);
router.delete('/addresses/:id', userAuth, deleteAddress);

// wishlist
router.get('/wishlist', userAuth, getMyWishlist);
router.post('/wishlist/toggle', userAuth, toggleWishlist);

// notifications (activity feed)
router.get('/notifications', userAuth, getUserNotifications);

// support tickets (issue reports on my orders — Help Center)
router.get('/support-tickets', userAuth, getMySupportTickets);

// user kyc
router.get('/kyc', userAuth, getMyUserKyc);
router.post(
  '/kyc',
  userAuth,
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
  ]),
  submitMyUserKyc,
);

export default router;
