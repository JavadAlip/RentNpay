import express from 'express';
import {
  adminLogin,
  adminLogout,
} from '../controller/admin/adminController.js';

const router = express.Router();

// Admin auth
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);

export default router;
