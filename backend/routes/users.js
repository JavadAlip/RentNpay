// import express from 'express';
// import User from '../models/User.js';
// import { adminAuth } from '../middleware/Auth.js';

// const router = express.Router();

// router.get('/', adminAuth, async (req, res) => {
//   try {
//     const users = await User.find().select('-password').sort({ createdAt: -1 });
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;

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
