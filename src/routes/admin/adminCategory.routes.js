// src/routes/admin/adminCategory.routes.js
import { Router } from 'express';
import {
  listCategories,
  addCategory,
  editCategory,
  removeCategory,
  toggleCategoryStatus,
} from '../../controllers/admin/adminCategory.controller.js';
import adminAuth from '../../middleware/adminAuth.js';
import { upload, uploadToCloudinary } from '../../config/cloudinary.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(adminAuth);

router.get('/', listCategories);
router.post('/', uploadLimiter, upload.single('image'), uploadToCloudinary, addCategory);
router.put('/:id', uploadLimiter, upload.single('image'), uploadToCloudinary, editCategory);
router.delete('/:id', removeCategory);
router.patch('/:id/toggle', toggleCategoryStatus);

export default router;