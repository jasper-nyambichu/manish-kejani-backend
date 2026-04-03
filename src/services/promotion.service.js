// src/services/promotion.service.js
import Promotion from '../models/promotion.model.js';
import { AppError } from '../shared/utils/AppError.js';
import { deleteImage } from '../config/cloudinary.js';

export const getActivePromotions = async () => {
  const now = new Date();
  return Promotion.find({
    isActive:  true,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  });
};

export const getAllPromotions = async () => {
  return Promotion.find();
};

export const getPromotionById = async (id) => {
  const promotion = await Promotion.findById(id);
  if (!promotion) throw new AppError('Promotion not found', 404);
  return promotion;
};

export const createPromotion = async (data, file = null) => {
  const { title, description, discountPercent, products, categories, startDate, endDate } = data;

  if (!title || !discountPercent || !startDate || !endDate) {
    throw new AppError('Title, discount, start date and end date are required', 400);
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError('End date must be after start date', 400);
  }

  const promotionData = {
    title,
    description,
    discountPercent: parseInt(discountPercent, 10),
    products:   products   ? JSON.parse(products)   : [],
    categories: categories ? JSON.parse(categories) : [],
    startDate:  new Date(startDate),
    endDate:    new Date(endDate),
  };

  if (file) {
    promotionData.bannerImage = { url: file.path, publicId: file.filename };
  }

  return Promotion.create(promotionData);
};

export const updatePromotion = async (id, data, file = null) => {
  const promotion = await Promotion.findById(id);
  if (!promotion) throw new AppError('Promotion not found', 404);

  const updates = { ...data };

  if (updates.discountPercent) updates.discountPercent = parseInt(updates.discountPercent, 10);
  if (updates.products)        updates.products        = JSON.parse(updates.products);
  if (updates.categories)      updates.categories      = JSON.parse(updates.categories);
  if (updates.startDate)       updates.startDate       = new Date(updates.startDate);
  if (updates.endDate)         updates.endDate         = new Date(updates.endDate);

  if (updates.startDate && updates.endDate && updates.startDate >= updates.endDate) {
    throw new AppError('End date must be after start date', 400);
  }

  if (file) {
    if (promotion.bannerImage?.publicId) await deleteImage(promotion.bannerImage.publicId);
    updates.bannerImage = { url: file.path, publicId: file.filename };
  }

  return Promotion.findByIdAndUpdate(id, updates);
};

export const deletePromotion = async (id) => {
  const promotion = await Promotion.findById(id);
  if (!promotion) throw new AppError('Promotion not found', 404);

  if (promotion.bannerImage?.publicId) await deleteImage(promotion.bannerImage.publicId);

  await Promotion.findByIdAndDelete(id);
};

export const togglePromotionStatus = async (id) => {
  const promotion = await Promotion.findById(id);
  if (!promotion) throw new AppError('Promotion not found', 404);

  return Promotion.findByIdAndUpdate(id, { isActive: !promotion.isActive });
};
