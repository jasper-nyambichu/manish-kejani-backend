// src/services/adminAuth.service.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';

const signAccess = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' });

export const loginAdmin = async ({ username, password }) => {
  const admin = await User.findOne({ username, role: 'admin' }).select('+password +refreshToken');
  if (!admin || !(await admin.comparePassword(password)))
    throw new AppError('Invalid credentials', 401);

  const accessToken = signAccess(admin._id);
  const refreshToken = signRefresh(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const refreshAdminToken = async (token) => {
  if (!token) throw new AppError('Refresh token required', 400);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const admin = await User.findOne({ _id: payload.id, refreshToken: token, role: 'admin' });
  if (!admin) throw new AppError('Invalid refresh token', 401);

  const accessToken = signAccess(admin._id);
  const refreshToken = signRefresh(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const logoutAdmin = async (adminId) => {
  await User.findByIdAndUpdate(adminId, { refreshToken: null });
};

export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  const admin = await User.findById(adminId).select('+password');
  if (!admin) throw new AppError('Admin not found', 404);

  if (!(await admin.comparePassword(currentPassword)))
    throw new AppError('Current password is incorrect', 401);

  admin.password = newPassword;
  admin.refreshToken = null;
  await admin.save();
};
