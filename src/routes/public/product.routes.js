// src/routes/public/product.routes.js
import { Router } from 'express';
import {
  listProducts,
  fetchProduct,
  listByCategory,
  search,
  featured,
  related,
} from '../../controllers/public/product.controller.js';

const router = Router();

router.get('/', listProducts);
router.get('/search', search);
router.get('/featured', featured);
router.get('/category/:slug', listByCategory);
router.get('/:id/related', related);
router.get('/:id', fetchProduct);

export default router;