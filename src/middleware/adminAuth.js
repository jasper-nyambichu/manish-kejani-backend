// src/middleware/adminAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';
import asyncHandler from '../shared/utils/asyncHandler.js';

const adminAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Access denied. No token provided.', 401);

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const admin = await User.findById(decoded.id);
  if (!admin)               throw new AppError('Access denied. Admin not found.', 401);
  if (admin.role !== 'admin') throw new AppError('Access denied. Admins only.', 403);

  req.admin = admin;
  next();
});

export default adminAuth;
