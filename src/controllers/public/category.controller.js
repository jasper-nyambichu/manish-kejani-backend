// src/controllers/public/category.controller.js
import Category from '../../models/category.model.js';
import { AppError } from '../../shared/utils/AppError.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listCategories = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  const categories = await Category.find({ isActive: true });
  sendSuccess(res, 200, 'Categories retrieved', categories);
});

export const fetchCategory = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new AppError('Category not found', 404);
  sendSuccess(res, 200, 'Category retrieved', category);
});