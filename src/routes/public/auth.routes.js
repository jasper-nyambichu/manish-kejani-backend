// src/routes/public/auth.routes.js
import { Router } from 'express';
import passport from 'passport';
import {
  register,
  verifyEmailHandler,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPasswordHandler,
  verifyResetCodeHandler,
  resetPasswordHandler,
  googleCallback,
  getProfile,
  updateProfile,
  wishlistToggle,
} from '../../controllers/public/auth.controller.js';
import { protect } from '../../middleware/userAuth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.get('/verify-email', verifyEmailHandler);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/verify-reset-code', authLimiter, verifyResetCodeHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`, session: false }),
  googleCallback
);

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.post('/wishlist/:productId', protect, wishlistToggle);
router.delete('/wishlist/:productId', protect, wishlistToggle);

export default router;