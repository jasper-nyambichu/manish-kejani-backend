// src/controllers/admin/adminProduct.controller.js
import multer from 'multer';
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
import { AppError } from '../../shared/utils/AppError.js';

// Sits after upload.array() in the route chain — catches multer/cloudinary errors
export const handleUploadErrors = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')  return next(new AppError('File too large. Max size is 5MB per image', 400));
    if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Too many files. Max 5 images allowed', 400));
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  if (err) return next(new AppError(err.message ?? 'File upload failed', 400));
  next();
};

export const listProducts = asyncHandler(async (req, res) => {
  const result = await getProducts({ ...req.query, status: undefined });
  sendSuccess(res, 200, 'Products retrieved', result);
});

export const fetchProduct = asyncHandler(async (req, res) => {
  const product = await getProductById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved', product);
});

export const addProduct = asyncHandler(async (req, res) => {
  const files = (req.files ?? []).filter(f => f.fieldname === 'images' || f.mimetype?.startsWith('image/'));
  if (files.length > 5) throw new AppError('Maximum 5 images allowed', 400);
  const product = await createProduct(req.body, files);
  sendSuccess(res, 201, 'Product created', product);
});

export const editProduct = asyncHandler(async (req, res) => {
  const files = (req.files ?? []).filter(f => f.fieldname === 'images' || f.mimetype?.startsWith('image/'));
  if (files.length > 5) throw new AppError('Maximum 5 images allowed', 400);
  const product = await updateProduct(req.params.id, req.body, files);
  sendSuccess(res, 200, 'Product updated', product);
});

export const removeProduct = asyncHandler(async (req, res) => {
  await deleteProduct(req.params.id);
  sendSuccess(res, 200, 'Product deleted');
});

export const removeProductImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new AppError('publicId is required', 400);
  const product = await deleteProductImage(req.params.id, publicId);
  sendSuccess(res, 200, 'Image deleted', product);
});

export const patchFeatured = asyncHandler(async (req, res) => {
  const product = await toggleFeatured(req.params.id);
  const message = product.featured ? 'Product marked as featured' : 'Product removed from featured';
  sendSuccess(res, 200, message, product);
});

export const patchStockStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new AppError('status is required in request body', 400);
  const product = await updateStockStatus(req.params.id, status);
  sendSuccess(res, 200, 'Stock status updated', product);
});
