// src/controllers/admin/adminDashboard.controller.js
import supabase from '../../config/db.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { PRODUCT_STATUS } from '../../shared/constants/productStatus.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now          = new Date().toISOString();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const startOfWeek  = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString(); })();

  const [
    { count: totalProducts },
    { count: inStockProducts },
    { count: outOfStockProducts },
    { count: featuredProducts },
    { count: totalCategories },
    { count: totalUsers },
    { count: usersThisMonth },
    { count: usersThisWeek },
    { count: verifiedUsers },
    { count: totalReviews },
    { count: activePromotions },
    { data: categoryBreakdown },
    { data: recentUsers },
    { data: topRatedProducts },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', PRODUCT_STATUS.IN_STOCK),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', PRODUCT_STATUS.OUT_OF_STOCK),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', startOfMonth),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', startOfWeek),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true).eq('role', 'user'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('start_date', now).gte('end_date', now),
    supabase.from('categories').select('id, name, product_count').eq('is_active', true).order('product_count', { ascending: false }),
    supabase.from('users').select('id, username, email, created_at, is_verified, auth_provider').eq('role', 'user').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('id, name, price, rating, reviews, images, categories!products_category_id_fkey(name)').eq('status', PRODUCT_STATUS.IN_STOCK).order('rating', { ascending: false }).limit(5),
    supabase.from('products').select('id, name, price, status, featured, created_at, categories!products_category_id_fkey(name)').order('created_at', { ascending: false }).limit(5),
  ]);

  sendSuccess(res, 200, 'Dashboard stats retrieved', {
    products: {
      total:      totalProducts   ?? 0,
      inStock:    inStockProducts ?? 0,
      outOfStock: outOfStockProducts ?? 0,
      featured:   featuredProducts ?? 0,
    },
    categories: {
      total:     totalCategories ?? 0,
      breakdown: (categoryBreakdown ?? []).map(r => ({ name: r.name, productCount: r.product_count })),
    },
    customers: {
      total:     totalUsers      ?? 0,
      thisMonth: usersThisMonth  ?? 0,
      thisWeek:  usersThisWeek   ?? 0,
      verified:  verifiedUsers   ?? 0,
    },
    reviews:    { total: totalReviews    ?? 0 },
    promotions: { active: activePromotions ?? 0 },
    recentUsers: (recentUsers ?? []).map(u => ({
      id: u.id, username: u.username, email: u.email,
      createdAt: u.created_at, isVerified: u.is_verified, authProvider: u.auth_provider,
    })),
    topRatedProducts: (topRatedProducts ?? []).map(p => ({
      id: p.id, name: p.name, price: p.price, rating: p.rating,
      reviews: p.reviews, images: p.images, category: p.categories,
    })),
    recentProducts: (recentProducts ?? []).map(p => ({
      id: p.id, name: p.name, price: p.price, status: p.status,
      featured: p.featured, createdAt: p.created_at, category: p.categories,
    })),
  });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  ?? '1',  10);
  const limit = parseInt(req.query.limit ?? '20', 10);
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  let query = supabase
    .from('users')
    .select('id, username, email, phone, is_verified, auth_provider, created_at, last_login', { count: 'exact' })
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (req.query.verified === 'true')  query = query.eq('is_verified', true);
  if (req.query.verified === 'false') query = query.eq('is_verified', false);
  if (req.query.provider)             query = query.eq('auth_provider', req.query.provider);

  const { data: users, count, error } = await query;
  if (error) throw new Error(error.message);

  sendSuccess(res, 200, 'Customers retrieved', {
    users: (users ?? []).map(u => ({
      id: u.id, username: u.username, email: u.email, phone: u.phone,
      isVerified: u.is_verified, authProvider: u.auth_provider,
      createdAt: u.created_at, lastLogin: u.last_login,
    })),
    pagination: { total: count ?? 0, page, limit, pages: Math.ceil((count ?? 0) / limit) },
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile retrieved', {
    id:        req.admin.id,
    username:  req.admin.username,
    email:     req.admin.email,
    lastLogin: req.admin.lastLogin,
  });
});
