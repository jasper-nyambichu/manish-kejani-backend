// src/routes/public/category.routes.js
import { Router } from 'express';
import {
  listCategories,
  fetchCategory,
} from '../../controllers/public/category.controller.js';

const router = Router();

router.get('/', listCategories);
router.get('/:slug', fetchCategory);

export default router;