// src/models/product.model.js
import mongoose from 'mongoose';
import { PRODUCT_STATUS } from '../shared/constants/productStatus.js';

const imageSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      maxlength: 200,
    },
    description: {
      type:      String,
      required:  [true, 'Product description is required'],
      trim:      true,
      maxlength: 2000,
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min:  [0, 'Original price cannot be negative'],
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v >= this.price;
        },
        message: 'Original price must be greater than or equal to current price',
      },
    },
    discountPercent: {
      type:    Number,
      min:     0,
      max:     100,
      default: 0,
    },
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },
    subcategory: {
      type:      String,
      trim:      true,
      maxlength: 100,
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (v) => v.length <= 5,
        message:   'Maximum 5 images per product',
      },
    },
    status: {
      type:    String,
      enum:    Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.IN_STOCK,
    },
    featured: {
      type:    Boolean,
      default: false,
    },
    isFlashDeal: {
      type:    Boolean,
      default: false,
    },
    isNewArrival: {
      type:    Boolean,
      default: false,
    },
    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },
    reviews: {
      type:    Number,
      default: 0,
      min:     0,
    },
    specifications: {
      type:    [specificationSchema],
      default: [],
    },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    sku: {
      type:   String,
      trim:   true,
      unique: true,
      sparse: true,
    },
    viewCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isFlashDeal: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ status: 1, featured: -1, createdAt: -1 });

productSchema.virtual('image').get(function () {
  return this.images?.[0]?.url ?? '';
});

productSchema.pre('save', function () {
  if (this.originalPrice && this.price) {
    this.discountPercent = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;