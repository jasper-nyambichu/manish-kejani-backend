// src/routes/admin/adminDashboard.routes.js
import { Router } from 'express';
import {
  getDashboardStats,
  listCustomers,
  getAdminProfile,
} from '../../controllers/admin/adminDashboard.controller.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

router.use(adminAuth);

router.get('/stats', getDashboardStats);
router.get('/customers', listCustomers);
router.get('/profile', getAdminProfile);

export default router;