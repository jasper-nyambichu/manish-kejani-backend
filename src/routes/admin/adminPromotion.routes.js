// src/routes/admin/adminPromotion.routes.js
import { Router } from 'express';
import {
  listPromotions,
  fetchPromotion,
  addPromotion,
  editPromotion,
  removePromotion,
  patchPromotionStatus,
} from '../../controllers/admin/adminPromotion.controller.js';
import adminAuth from '../../middleware/adminAuth.js';
import { upload } from '../../config/cloudinary.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(adminAuth);

router.get('/', listPromotions);
router.get('/:id', fetchPromotion);
router.post('/', uploadLimiter, upload.single('bannerImage'), addPromotion);
router.put('/:id', uploadLimiter, upload.single('bannerImage'), editPromotion);
router.delete('/:id', removePromotion);
router.patch('/:id/toggle', patchPromotionStatus);

export default router;