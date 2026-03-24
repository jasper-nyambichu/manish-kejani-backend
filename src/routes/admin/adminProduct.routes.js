// src/routes/admin/adminProduct.routes.js
import { Router } from 'express';
import {
  listProducts,
  fetchProduct,
  addProduct,
  editProduct,
  removeProduct,
  removeProductImage,
  patchFeatured,
  patchStockStatus,
} from '../../controllers/admin/adminProduct.controller.js';
import adminAuth from '../../middleware/adminAuth.js';
import { upload } from '../../config/cloudinary.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(adminAuth);

router.get('/', listProducts);
router.get('/:id', fetchProduct);
router.post('/', uploadLimiter, upload.array('images', 5), addProduct);
router.put('/:id', uploadLimiter, upload.array('images', 5), editProduct);
router.delete('/:id', removeProduct);
router.delete('/:id/image', removeProductImage);
router.patch('/:id/featured', patchFeatured);
router.patch('/:id/stock', patchStockStatus);

export default router;