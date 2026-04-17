// src/services/wishlist.service.js
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../shared/utils/AppError.js';

export const getWishlist = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (!user.wishlist || user.wishlist.length === 0) return [];

  const products = await Promise.all(
    user.wishlist.map((id) => Product.findById(id).catch(() => null))
  );
  return products.filter(Boolean);
};

export const addToWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const list = user.wishlist ?? [];
  if (list.includes(productId)) throw new AppError('Product already in wishlist', 409);

  await User.findByIdAndUpdate(userId, { wishlist: [...list, productId] });
  return { message: 'Added to wishlist' };
};

export const removeFromWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const list = (user.wishlist ?? []).filter((id) => id !== productId);
  await User.findByIdAndUpdate(userId, { wishlist: list });
  return { message: 'Removed from wishlist' };
};
