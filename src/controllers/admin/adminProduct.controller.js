// src/controllers/admin/adminProduct.controller.js
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  toggleFeatured,
  updateStockStatus,
} from '../../services/product.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => {
  const result = await getProducts({ ...req.query, status: undefined });
  sendSuccess(res, 200, 'Products retrieved', result);
});

export const fetchProduct = asyncHandler(async (req, res) => {
  const product = await getProductById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved', product);
});

export const addProduct = asyncHandler(async (req, res) => {
  const product = await createProduct(req.body, req.files ?? []);
  sendSuccess(res, 201, 'Product created', product);
});

export const editProduct = asyncHandler(async (req, res) => {
  const product = await updateProduct(req.params.id, req.body, req.files ?? []);
  sendSuccess(res, 200, 'Product updated', product);
});

export const removeProduct = asyncHandler(async (req, res) => {
  await deleteProduct(req.params.id);
  sendSuccess(res, 200, 'Product deleted');
});

export const removeProductImage = asyncHandler(async (req, res) => {
  const product = await deleteProductImage(req.params.id, req.body.publicId);
  sendSuccess(res, 200, 'Image deleted', product);
});

export const patchFeatured = asyncHandler(async (req, res) => {
  const product = await toggleFeatured(req.params.id);
  const message = product.featured ? 'Product marked as featured' : 'Product removed from featured';
  sendSuccess(res, 200, message, product);
});

export const patchStockStatus = asyncHandler(async (req, res) => {
  const product = await updateStockStatus(req.params.id, req.body.status);
  sendSuccess(res, 200, 'Stock status updated', product);
});