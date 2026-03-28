// src/controllers/public/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  refreshUserToken,
  logoutUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  handleGoogleCallback,
  getUserProfile,
  updateUserProfile,
  toggleWishlist,
} from '../../services/auth.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { AppError } from '../../shared/utils/AppError.js';

export const register = asyncHandler(async (req, res) => {
  const { username, email, phone, password } = req.body;
  const result = await registerUser({ username, email, phone, password });
  sendSuccess(res, 201, result.message, {
    user:         result.user,
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const verifyEmailHandler = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await verifyEmail(token);
  sendSuccess(res, 200, 'Email verified successfully. Welcome to Manish Kejani!', result);
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await resendVerificationEmail(email);
  sendSuccess(res, 200, result.message);
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await loginUser({ username, password });
  sendSuccess(res, 200, 'Login successful', result);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await refreshUserToken(refreshToken);
  sendSuccess(res, 200, 'Token refreshed', tokens);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);
  sendSuccess(res, 200, 'Logged out successfully');
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await forgotPassword(email);
  sendSuccess(res, 200, result.message);
});

export const verifyResetCodeHandler = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const result = await verifyResetCode(email, code);
  sendSuccess(res, 200, result.message, { resetSessionToken: result.resetSessionToken });
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { email, resetSessionToken, newPassword } = req.body;
  const result = await resetPassword(email, resetSessionToken, newPassword);
  sendSuccess(res, 200, result.message);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await handleGoogleCallback(req.user);

  const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;

  res.redirect(redirectUrl);
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user._id);
  sendSuccess(res, 200, 'Profile retrieved', user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user._id, req.body);
  sendSuccess(res, 200, 'Profile updated', user);
});

export const wishlistToggle = asyncHandler(async (req, res) => {
  const result = await toggleWishlist(req.user._id, req.params.productId);
  const message = result.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist';
  sendSuccess(res, 200, message, result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both passwords are required', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new AppError('User not found', 404);
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully. Please log in again.');
});