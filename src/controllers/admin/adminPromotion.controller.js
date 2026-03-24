// src/controllers/admin/adminPromotion.controller.js
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
} from '../../services/promotion.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const listPromotions = asyncHandler(async (_req, res) => {
  const promotions = await getAllPromotions();
  sendSuccess(res, 200, 'Promotions retrieved', promotions);
});

export const fetchPromotion = asyncHandler(async (req, res) => {
  const promotion = await getPromotionById(req.params.id);
  sendSuccess(res, 200, 'Promotion retrieved', promotion);
});

export const addPromotion = asyncHandler(async (req, res) => {
  const promotion = await createPromotion(req.body, req.file ?? null);
  sendSuccess(res, 201, 'Promotion created', promotion);
});

export const editPromotion = asyncHandler(async (req, res) => {
  const promotion = await updatePromotion(req.params.id, req.body, req.file ?? null);
  sendSuccess(res, 200, 'Promotion updated', promotion);
});

export const removePromotion = asyncHandler(async (req, res) => {
  await deletePromotion(req.params.id);
  sendSuccess(res, 200, 'Promotion deleted');
});

export const patchPromotionStatus = asyncHandler(async (req, res) => {
  const promotion = await togglePromotionStatus(req.params.id);
  const message = promotion.isActive ? 'Promotion activated' : 'Promotion deactivated';
  sendSuccess(res, 200, message, promotion);
});