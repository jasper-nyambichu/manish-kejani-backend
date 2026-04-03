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

  const [byEmail, byUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
  ]);

  if (byEmail)    throw new AppError('Email already registered', 409);
  if (byUsername) throw new AppError('Username already taken', 409);

  const user = await User.create({ username, email, phone, password, isVerified: true });

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await User.findByIdAndUpdate(user.id, { refreshToken, lastLogin: new Date() });

  return {
    message: 'Account created successfully. Welcome to Manish Kejani!',
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified },
  };
};

export const verifyEmail = async (token) => {
  if (!token) throw new AppError('Verification token is required', 400);

  const user = await User.findOne({ verificationToken: token });
  if (!user) throw new AppError('Invalid verification token', 400);

  if (new Date(user.verificationExpiry) < new Date()) {
    throw new AppError('Verification token has expired. Please request a new one.', 400);
  }

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await User.findByIdAndUpdate(user.id, {
    isVerified: true,
    verificationToken: null,
    verificationExpiry: null,
    refreshToken,
    lastLogin: new Date(),
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, isVerified: true },
  };
};

export const resendVerificationEmail = async (email) => {
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with this email', 404);
  if (user.isVerified) throw new AppError('This account is already verified', 400);

  const verificationToken  = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(user.id, { verificationToken, verificationExpiry });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  await sendVerificationEmail({ to: email, username: user.username, verificationUrl });

  return { message: 'Verification email resent. Please check your inbox.' };
};

export const loginUser = async ({ username, password }) => {
  if (!username || !password) throw new AppError('Username and password are required', 400);

  const user = await User.findOne({ username });
  if (!user || !user.password) throw new AppError('Invalid username or password', 401);

  const valid = await User.comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid username or password', 401);

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await User.findByIdAndUpdate(user.id, { refreshToken, lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified },
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

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await User.findByIdAndUpdate(user.id, { refreshToken });

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

  const resetCode       = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await User.findByIdAndUpdate(user.id, { resetCode, resetCodeExpiry });
  await sendPasswordResetEmail({ to: email, username: user.username, resetCode });

  return { message: 'Password reset code sent to your email.' };
};

export const verifyResetCode = async (email, code) => {
  if (!email || !code) throw new AppError('Email and reset code are required', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with this email', 404);
  if (!user.resetCode || user.resetCode !== code) throw new AppError('Invalid reset code', 400);
  if (new Date(user.resetCodeExpiry) < new Date()) throw new AppError('Reset code has expired. Please request a new one.', 400);

  const resetSessionToken = crypto.randomBytes(32).toString('hex');
  await User.findByIdAndUpdate(user.id, {
    resetCode: resetSessionToken,
    resetCodeExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  return { message: 'Code verified. You may now reset your password.', resetSessionToken };
};

export const resetPassword = async (email, resetSessionToken, newPassword) => {
  if (!email || !resetSessionToken || !newPassword) {
    throw new AppError('Email, session token and new password are required', 400);
  }
  if (newPassword.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with this email', 404);
  if (!user.resetCode || user.resetCode !== resetSessionToken) throw new AppError('Invalid or expired reset session', 400);
  if (new Date(user.resetCodeExpiry) < new Date()) throw new AppError('Reset session expired. Please start over.', 400);

  const hashed = await import('bcryptjs').then(m => m.default.hash(newPassword, 12));
  await User.findByIdAndUpdate(user.id, {
    password: hashed,
    resetCode: null,
    resetCodeExpiry: null,
    refreshToken: null,
  });

  return { message: 'Password reset successfully. Please log in.' };
};

export const handleGoogleCallback = async (user) => {
  const { accessToken, refreshToken } = generateTokenPair(user.id);
  await User.findByIdAndUpdate(user.id, { refreshToken });
  return { accessToken, refreshToken };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Populate wishlist products
  let wishlist = [];
  if (user.wishlist?.length > 0) {
    const { data } = await import('../config/db.js').then(m =>
      m.default.from('products').select('id, name, price, images, status').in('id', user.wishlist)
    );
    wishlist = (data ?? []).map(p => ({ id: p.id, name: p.name, price: p.price, images: p.images, status: p.status }));
  }

  return { ...user, wishlist };
};

export const updateUserProfile = async (userId, updates) => {
  const allowed = ['phone', 'email'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );
  const user = await User.findByIdAndUpdate(userId, filtered);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const toggleWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const wishlist = user.wishlist ?? [];
  const index    = wishlist.indexOf(productId);
  let action;

  if (index === -1) {
    wishlist.push(productId);
    action = 'added';
  } else {
    wishlist.splice(index, 1);
    action = 'removed';
  }

  await User.findByIdAndUpdate(userId, { wishlist });
  return { action, wishlistCount: wishlist.length };
};