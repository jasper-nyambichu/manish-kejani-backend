// src/services/adminAuth.service.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '15m',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.ADMIN_REFRESH_SECRET, {
    expiresIn: process.env.ADMIN_REFRESH_EXPIRES_IN ?? '7d',
  });

export const loginAdmin = async ({ username, password }) => {
  if (!username || !password) throw new AppError('Username and password are required', 400);

  const admin = await User.findOne({ username, role: 'admin' });
  if (!admin || !admin.password) throw new AppError('Invalid username or password', 401);

  const valid = await User.comparePassword(password, admin.password);
  if (!valid) throw new AppError('Invalid username or password', 401);

  const accessToken  = signAccessToken(admin.id);
  const refreshToken = signRefreshToken(admin.id);

  await User.findByIdAndUpdate(admin.id, { refreshToken, lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    admin: { id: admin.id, username: admin.username, email: admin.email, lastLogin: new Date() },
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

  const admin = await User.findOne({ id: payload.id, refreshToken: token, role: 'admin' });
  if (!admin) throw new AppError('Invalid refresh token', 401);

  const accessToken  = signAccessToken(admin.id);
  const refreshToken = signRefreshToken(admin.id);

  await User.findByIdAndUpdate(admin.id, { refreshToken });
  return { accessToken, refreshToken };
};

export const logoutAdmin = async (adminId) => {
  await User.findByIdAndUpdate(adminId, { refreshToken: null });
};

export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) throw new AppError('Both current and new password are required', 400);
  if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

  const admin = await User.findById(adminId);
  if (!admin) throw new AppError('Admin not found', 404);

  const valid = await User.comparePassword(currentPassword, admin.password);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const hashed = await import('bcryptjs').then(m => m.default.hash(newPassword, 12));
  await User.findByIdAndUpdate(adminId, { password: hashed, refreshToken: null });
};
