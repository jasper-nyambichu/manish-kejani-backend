// src/controllers/admin/adminCategory.controller.js
import Category from '../../models/category.model.js';
import { AppError } from '../../shared/utils/AppError.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { deleteImage } from '../../config/cloudinary.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  sendSuccess(res, 200, 'Categories retrieved', categories);
});

export const addCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, sortOrder } = req.body;

  if (!name) throw new AppError('Category name is required', 400);

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const categoryData = { name, slug, description, icon, sortOrder };

  if (req.file) {
    categoryData.image = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  const category = await Category.create(categoryData);
  sendSuccess(res, 201, 'Category created', category);
});

export const editCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const updates = { ...req.body };

  if (updates.name) {
    updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  if (req.file) {
    if (category.image?.publicId) await deleteImage(category.image.publicId);
    updates.image = { url: req.file.path, publicId: req.file.filename };
  }

  const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, 'Category updated', updated);
});

export const removeCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  if (category.productCount > 0) {
    throw new AppError('Cannot delete a category that has products', 400);
  }

  if (category.image?.publicId) await deleteImage(category.image.publicId);

  await Category.findByIdAndDelete(req.params.id);
  sendSuccess(res, 200, 'Category deleted');
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  category.isActive = !category.isActive;
  await category.save();

  const message = category.isActive ? 'Category activated' : 'Category deactivated';
  sendSuccess(res, 200, message, category);
});