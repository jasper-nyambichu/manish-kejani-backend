// src/controllers/admin/adminCategory.controller.js
import Category from '../../models/category.model.js';
import { AppError } from '../../shared/utils/AppError.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { deleteImage } from '../../config/cloudinary.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({});
  sendSuccess(res, 200, 'Categories retrieved', categories);
});

export const addCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, sortOrder } = req.body;
  if (!name) throw new AppError('Category name is required', 400);

  const categoryData = { name, description, icon, sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0 };
  if (req.file) categoryData.image = { url: req.file.path, publicId: req.file.filename };

  const category = await Category.create(categoryData);
  sendSuccess(res, 201, 'Category created', category);
});

export const editCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const updates = { ...req.body };
  if (req.file) {
    if (category.image?.publicId) await deleteImage(category.image.publicId);
    updates.image = { url: req.file.path, publicId: req.file.filename };
  }

  const updated = await Category.findByIdAndUpdate(req.params.id, updates);
  sendSuccess(res, 200, 'Category updated', updated);
});

export const removeCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  if (category.productCount > 0) throw new AppError('Cannot delete a category that has products', 400);
  if (category.image?.publicId) await deleteImage(category.image.publicId);
  await Category.findByIdAndDelete(req.params.id);
  sendSuccess(res, 200, 'Category deleted');
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const updated = await Category.findByIdAndUpdate(req.params.id, { isActive: !category.isActive });
  const message = !category.isActive ? 'Category activated' : 'Category deactivated';
  sendSuccess(res, 200, message, updated);
});