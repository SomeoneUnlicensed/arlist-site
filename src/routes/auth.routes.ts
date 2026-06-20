import { Router } from 'express';
import {
  register, login, logout, verifyEmail, resendVerification,
  getProfile, updateProfile, changePassword, getRegistrationStatus,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/registration-status', getRegistrationStatus);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
