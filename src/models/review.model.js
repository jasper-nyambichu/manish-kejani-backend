// src/models/review.model.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: 1000,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;