// src/services/review.service.js
import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../shared/utils/AppError.js';

const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

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
    Review.find({ product: productId })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: productId }),
  ]);

  return {
    reviews: reviewList,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const createReview = async (productId, userId, { rating, comment }) => {
  if (!rating || !comment) {
    throw new AppError('Rating and comment are required', 400);
  }

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) throw new AppError('You have already reviewed this product', 409);

  const review = await Review.create({
    product: productId,
    user:    userId,
    rating:  parseInt(rating, 10),
    comment,
  });

  await recalculateProductRating(product._id);

  return review.populate('user', 'username');
};

export const updateReview = async (reviewId, userId, { rating, comment }) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);

  if (review.user.toString() !== userId.toString()) {
    throw new AppError('You can only edit your own reviews', 403);
  }

  if (rating)  review.rating  = parseInt(rating, 10);
  if (comment) review.comment = comment;

  await review.save();
  await recalculateProductRating(review.product);

  return review.populate('user', 'username');
};

export const deleteReview = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);

  if (review.user.toString() !== userId.toString()) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  await Review.findByIdAndDelete(reviewId);
  await recalculateProductRating(review.product);
};