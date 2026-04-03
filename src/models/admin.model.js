// src/models/admin.model.js
// NOTE: Admins are users with role='admin' — same as original MongoDB implementation.
// This model re-exports User with admin-specific helpers for backward compatibility.
import User from './user.model.js';
import bcrypt from 'bcryptjs';
import supabase from '../config/db.js';

const Admin = {
  async findOne(filter = {}) {
    return User.findOne({ ...filter, role: 'admin' });
  },

  async findById(id) {
    const user = await User.findById(id);
    if (!user || user.role !== 'admin') return null;
    return user;
  },

  async create(data) {
    return User.create({ ...data, role: 'admin', isVerified: true });
  },

  async findByIdAndUpdate(id, updates) {
    return User.findByIdAndUpdate(id, updates);
  },

  comparePassword: async (plainText, hashed) => bcrypt.compare(plainText, hashed),
};

export default Admin;
