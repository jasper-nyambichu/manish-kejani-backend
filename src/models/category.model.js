// src/models/category.model.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Category name is required'],
      unique:    true,
      trim:      true,
      maxlength: 50,
    },
    slug: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: 300,
    },
    icon: {
      type: String,
      trim: true,
    },
    image: {
      url:      { type: String },
      publicId: { type: String },
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    productCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    sortOrder: {
      type:    Number,
      default: 0,
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

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;