// src/middleware/adminAuth.js
// NOTE: There is NO separate Admin model. Admins are Users with role:'admin'.
// NOTE: Do NOT change JWT_SECRET to ADMIN_JWT_SECRET — they must match adminAuth.service.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';
import asyncHandler from '../shared/utils/asyncHandler.js';

const adminAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const admin = await User.findById(decoded.id).select('-password -refreshToken');

  if (!admin) throw new AppError('Access denied. Admin not found.', 401);
  if (admin.role !== 'admin') throw new AppError('Access denied. Admins only.', 403);

  req.admin = admin;
  next();
});

export default adminAuth;
