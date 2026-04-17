// src/controllers/public/wishlist.controller.js
import { getWishlist, addToWishlist, removeFromWishlist } from '../../services/wishlist.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listWishlist = asyncHandler(async (req, res) => {
  const items = await getWishlist(req.user.id);
  sendSuccess(res, 200, 'Wishlist retrieved', items);
});

export const addItem = asyncHandler(async (req, res) => {
  const result = await addToWishlist(req.user.id, req.params.productId);
  sendSuccess(res, 200, result.message);
});

export const removeItem = asyncHandler(async (req, res) => {
  const result = await removeFromWishlist(req.user.id, req.params.productId);
  sendSuccess(res, 200, result.message);
});
