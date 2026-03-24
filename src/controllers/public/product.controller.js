// src/controllers/public/product.controller.js
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getRelatedProducts,
} from '../../services/product.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => {
  const result = await getProducts(req.query);
  sendSuccess(res, 200, 'Products retrieved', result);
});

export const fetchProduct = asyncHandler(async (req, res) => {
  const product = await getProductById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved', product);
});

export const listByCategory = asyncHandler(async (req, res) => {
  const result = await getProductsByCategory(req.params.slug, req.query);
  sendSuccess(res, 200, 'Products retrieved', result);
});

export const search = asyncHandler(async (req, res) => {
  const result = await searchProducts(req.query.q, req.query);
  sendSuccess(res, 200, 'Search results', result);
});

export const featured = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit ?? '8', 10);
  const products = await getFeaturedProducts(limit);
  sendSuccess(res, 200, 'Featured products retrieved', products);
});

export const related = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit ?? '4', 10);
  const products = await getRelatedProducts(req.params.id, limit);
  sendSuccess(res, 200, 'Related products retrieved', products);
});