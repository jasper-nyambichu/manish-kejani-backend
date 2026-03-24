// src/models/promotion.model.js
import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Promotion title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: 1,
      max: 100,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    bannerImage: {
      url: String,
      publicId: String,
    },
  },
  { timestamps: true }
);

promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;