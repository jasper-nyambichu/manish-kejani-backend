// src/services/auth.service.js
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { AppError } from '../shared/utils/AppError.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './mail.service.js';

const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  });

const generateTokenPair = (userId) => ({
  accessToken: signAccessToken(userId),
  refreshToken: signRefreshToken(userId),
});

export const registerUser = async ({ username, email, phone, password }) => {
  if (!username || !email || !password) {
    throw new AppError('Username, email and password are required', 400);
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });

  if (existing?.email === email) throw new AppError('Email already registered', 409);
  if (existing?.username === username) throw new AppError('Username already taken', 409);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    username,
    email,
    phone,
    password,
    verificationToken,
    verificationExpiry,
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await sendVerificationEmail({ to: email, username, verificationUrl });

  return {
    message: 'Account created. Please check your email to verify your account.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    },
  };
};

export const verifyEmail = async (token) => {
  if (!token) throw new AppError('Verification token is required', 400);

  const user = await User.findOne({ verificationToken: token })
    .select('+verificationToken +verificationExpiry');

  if (!user) throw new AppError('Invalid verification token', 400);

  if (user.verificationExpiry < new Date()) {
    throw new AppError('Verification token has expired. Please request a new one.', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpiry = undefined;
  const { accessToken, refreshToken } = generateTokenPair(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    },
  };
};

export const resendVerificationEmail = async (email) => {
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email })
    .select('+verificationToken +verificationExpiry');

  if (!user) throw new AppError('No account found with this email', 404);
  if (user.isVerified) throw new AppError('This account is already verified', 400);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verificationToken = verificationToken;
  user.verificationExpiry = verificationExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await sendVerificationEmail({
    to: email,
    username: user.username,
    verificationUrl,
  });

  return { message: 'Verification email resent. Please check your inbox.' };
};

export const loginUser = async ({ username, password }) => {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const user = await User.findOne({ username }).select('+password +refreshToken');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid username or password', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const { accessToken, refreshToken } = generateTokenPair(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    },
  };
};

export const refreshUserToken = async (token) => {
  if (!token) throw new AppError('Refresh token required', 400);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const { accessToken, refreshToken } = generateTokenPair(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const forgotPassword = async (email) => {
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email });

  if (!user) throw new AppError('No account found with this email', 404);

  if (user.authProvider === 'google') {
    throw new AppError('This account uses Google sign-in. Please use Google to access your account.', 400);
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetCode = resetCode;
  user.resetCodeExpiry = resetCodeExpiry;
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail({
    to: email,
    username: user.username,
    resetCode,
  });

  return { message: 'Password reset code sent to your email.' };
};

export const verifyResetCode = async (email, code) => {
  if (!email || !code) throw new AppError('Email and reset code are required', 400);

  const user = await User.findOne({ email }).select('+resetCode +resetCodeExpiry');

  if (!user) throw new AppError('No account found with this email', 404);

  if (!user.resetCode || user.resetCode !== code) {
    throw new AppError('Invalid reset code', 400);
  }

  if (user.resetCodeExpiry < new Date()) {
    throw new AppError('Reset code has expired. Please request a new one.', 400);
  }

  const resetSessionToken = crypto.randomBytes(32).toString('hex');

  user.resetCode = resetSessionToken;
  user.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  return {
    message: 'Code verified. You may now reset your password.',
    resetSessionToken,
  };
};

export const resetPassword = async (email, resetSessionToken, newPassword) => {
  if (!email || !resetSessionToken || !newPassword) {
    throw new AppError('Email, session token and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const user = await User.findOne({ email }).select('+resetCode +resetCodeExpiry +password');

  if (!user) throw new AppError('No account found with this email', 404);

  if (!user.resetCode || user.resetCode !== resetSessionToken) {
    throw new AppError('Invalid or expired reset session', 400);
  }

  if (user.resetCodeExpiry < new Date()) {
    throw new AppError('Reset session expired. Please start over.', 400);
  }

  user.password = newPassword;
  user.resetCode = undefined;
  user.resetCodeExpiry = undefined;
  user.refreshToken = null;
  await user.save();

  return { message: 'Password reset successfully. Please log in.' };
};

export const handleGoogleCallback = async (user) => {
  const { accessToken, refreshToken } = generateTokenPair(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate('wishlist', 'name price images status')
    .lean();

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserProfile = async (userId, updates) => {
  const allowed = ['phone', 'email'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const toggleWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const index = user.wishlist.indexOf(productId);
  let action;

  if (index === -1) {
    user.wishlist.push(productId);
    action = 'added';
  } else {
    user.wishlist.splice(index, 1);
    action = 'removed';
  }

  await user.save({ validateBeforeSave: false });
  return { action, wishlistCount: user.wishlist.length };
};