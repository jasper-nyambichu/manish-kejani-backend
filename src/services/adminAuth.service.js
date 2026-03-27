// src/services/adminAuth.service.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  });

export const loginAdmin = async ({ username, password }) => {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const admin = await User.findOne({ username, role: 'admin' }).select('+password +refreshToken');

  if (!admin || !(await admin.comparePassword(password))) {
    throw new AppError('Invalid username or password', 401);
  }

  const accessToken  = signAccessToken(admin._id);
  const refreshToken = signRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  admin.lastLogin    = new Date();
  await admin.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    admin: {
      id:        admin._id,
      username:  admin.username,
      email:     admin.email,
      lastLogin: admin.lastLogin,
    },
  };
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

  const accessToken  = signAccessToken(admin._id);
  const refreshToken = signRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const logoutAdmin = async (adminId) => {
  await User.findByIdAndUpdate(adminId, { refreshToken: null });
};

export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('Both current and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const admin = await User.findById(adminId).select('+password');
  if (!admin) throw new AppError('Admin not found', 404);

  if (!(await admin.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  admin.password     = newPassword;
  admin.refreshToken = null;
  await admin.save();
};
