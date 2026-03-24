// src/routes/public/review.routes.js
import { Router } from 'express';
import {
  listReviews,
  submitReview,
  editReview,
  removeReview,
} from '../../controllers/public/review.controller.js';
import { protect } from '../../middleware/userAuth.js';

const router = Router();

router.get('/:productId', listReviews);
router.post('/:productId', protect, submitReview);
router.patch('/:reviewId', protect, editReview);
router.delete('/:reviewId', protect, removeReview);

export default router;