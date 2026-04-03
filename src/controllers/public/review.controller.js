// src/controllers/public/review.controller.js
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../../services/review.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listReviews = asyncHandler(async (req, res) => {
  const result = await getProductReviews(req.params.productId, req.query);
  sendSuccess(res, 200, 'Reviews retrieved', result);
});

export const submitReview = asyncHandler(async (req, res) => {
  const review = await createReview(
    req.params.productId,
    req.user.id,
    req.body
  );
  sendSuccess(res, 201, 'Review submitted', review);
});

export const editReview = asyncHandler(async (req, res) => {
  const review = await updateReview(req.params.reviewId, req.user.id, req.body);
  sendSuccess(res, 200, 'Review updated', review);
});

export const removeReview = asyncHandler(async (req, res) => {
  await deleteReview(req.params.reviewId, req.user.id);
  sendSuccess(res, 200, 'Review deleted');
});