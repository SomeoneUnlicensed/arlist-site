import { Router } from 'express';
import {
  register, login, logout, verifyEmail, resendVerification,
  getProfile, updateProfile, changePassword, getRegistrationStatus,
  verifyLogin2fa, forgotPassword, resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAltcha } from '../middleware/altcha.middleware.js';

const router = Router();

router.post('/register', requireAltcha, register);
router.post('/login', requireAltcha, login);
router.post('/verify-login-2fa', verifyLogin2fa);
router.post('/logout', logout);
router.post('/verify', verifyEmail);
router.post('/resend-verification', requireAltcha, resendVerification);
router.post('/forgot-password', requireAltcha, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/registration-status', getRegistrationStatus);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
