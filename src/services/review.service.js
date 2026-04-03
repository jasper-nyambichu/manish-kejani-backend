// src/services/review.service.js
import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../shared/utils/AppError.js';

const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate(productId);
  const rating  = result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
  const reviews = result.length > 0 ? result[0].count : 0;
  await Product.findByIdAndUpdate(productId, { rating, reviews });
};

export const getProductReviews = async (productId, filters = {}) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const page  = parseInt(filters.page  ?? '1',  10);
  const limit = parseInt(filters.limit ?? '10', 10);
  const skip  = (page - 1) * limit;

  const [reviewList, total] = await Promise.all([
    Review.find({ product_id: productId }, { skip, limit }),
    Review.countDocuments({ product_id: productId }),
  ]);

  return { reviews: reviewList, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const createReview = async (productId, userId, { rating, comment }) => {
  if (!rating || !comment) throw new AppError('Rating and comment are required', 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const existing = await Review.findOne({ product_id: productId, user_id: userId });
  if (existing) throw new AppError('You have already reviewed this product', 409);

  const review = await Review.create({ product: productId, user: userId, rating: parseInt(rating, 10), comment });
  await recalculateProductRating(productId);
  return review;
};

export const updateReview = async (reviewId, userId, { rating, comment }) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.user?.id !== userId && review.user !== userId) throw new AppError('You can only edit your own reviews', 403);

  const updated = await Review.findByIdAndUpdate(reviewId, {
    ...(rating  ? { rating: parseInt(rating, 10) } : {}),
    ...(comment ? { comment } : {}),
  });
  await recalculateProductRating(review.product);
  return updated;
};

export const deleteReview = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.user?.id !== userId && review.user !== userId) throw new AppError('You can only delete your own reviews', 403);

  await Review.findByIdAndDelete(reviewId);
  await recalculateProductRating(review.product);
};