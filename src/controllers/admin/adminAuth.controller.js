// src/controllers/admin/adminAuth.controller.js
import {
  loginAdmin,
  refreshAdminToken,
  logoutAdmin,
  changeAdminPassword,
} from '../../services/adminAuth.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await loginAdmin({ username, password });
  sendSuccess(res, 200, 'Login successful', result);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await refreshAdminToken(refreshToken);
  sendSuccess(res, 200, 'Token refreshed', tokens);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutAdmin(req.admin._id);
  sendSuccess(res, 200, 'Logged out successfully');
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await changeAdminPassword(req.admin._id, currentPassword, newPassword);
  sendSuccess(res, 200, 'Password updated. Please log in again.');
});