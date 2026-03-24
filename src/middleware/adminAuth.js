// src/middleware/adminAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';
import asyncHandler from '../shared/utils/asyncHandler.js';

const adminAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Access denied', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const admin = await User.findById(decoded.id).select('-password -refreshToken');

  if (!admin || admin.role !== 'admin') throw new AppError('Access denied', 401);

  req.admin = admin;
  next();
});

export default adminAuth;