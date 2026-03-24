// src/controllers/admin/adminDashboard.controller.js
import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import User from '../../models/user.model.js';
import Review from '../../models/review.model.js';
import Promotion from '../../models/promotion.model.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { PRODUCT_STATUS } from '../../shared/constants/productStatus.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    totalProducts,
    inStockProducts,
    outOfStockProducts,
    featuredProducts,
    totalCategories,
    totalUsers,
    usersThisMonth,
    usersThisWeek,
    verifiedUsers,
    totalReviews,
    activePromotions,
    categoryBreakdown,
    recentUsers,
    topRatedProducts,
    recentProducts,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: PRODUCT_STATUS.IN_STOCK }),
    Product.countDocuments({ status: PRODUCT_STATUS.OUT_OF_STOCK }),
    Product.countDocuments({ featured: true }),
    Category.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    User.countDocuments({ isVerified: true }),
    Review.countDocuments(),
    Promotion.countDocuments({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }),
    Category.aggregate([
      { $match: { isActive: true } },
      { $project: { name: 1, productCount: 1 } },
      { $sort: { productCount: -1 } },
    ]),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt isVerified authProvider')
      .lean(),
    Product.find({ status: PRODUCT_STATUS.IN_STOCK })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(5)
      .select('name price rating reviewCount images category')
      .populate('category', 'name')
      .lean(),
    Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price status featured createdAt')
      .populate('category', 'name')
      .lean(),
  ]);

  sendSuccess(res, 200, 'Dashboard stats retrieved', {
    products: {
      total: totalProducts,
      inStock: inStockProducts,
      outOfStock: outOfStockProducts,
      featured: featuredProducts,
    },
    categories: {
      total: totalCategories,
      breakdown: categoryBreakdown,
    },
    customers: {
      total: totalUsers,
      thisMonth: usersThisMonth,
      thisWeek: usersThisWeek,
      verified: verifiedUsers,
    },
    reviews: {
      total: totalReviews,
    },
    promotions: {
      active: activePromotions,
    },
    recentUsers,
    topRatedProducts,
    recentProducts,
  });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page ?? '1', 10);
  const limit = parseInt(req.query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.verified === 'true') query.isVerified = true;
  if (req.query.verified === 'false') query.isVerified = false;
  if (req.query.provider) query.authProvider = req.query.provider;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('username email phone isVerified authProvider createdAt lastLogin')
      .lean(),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Customers retrieved', {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile retrieved', {
    id: req.admin._id,
    username: req.admin.username,
    email: req.admin.email,
    lastLogin: req.admin.lastLogin,
  });
});