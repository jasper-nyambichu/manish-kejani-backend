// src/routes/admin/adminAuth.routes.js
import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  updatePassword,
} from '../../controllers/admin/adminAuth.controller.js';
import adminAuth from '../../middleware/adminAuth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', adminAuth, logout);
router.patch('/password', adminAuth, updatePassword);

export default router;