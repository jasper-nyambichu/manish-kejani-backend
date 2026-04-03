// src/models/user.model.js
import bcrypt from 'bcryptjs';
import supabase from '../config/db.js';

const TABLE = 'users';

// Map DB row (snake_case) → app object (camelCase) matching original Mongoose toJSON transform
const toUser = (row) => {
  if (!row) return null;
  return {
    id:                 row.id,
    username:           row.username,
    email:              row.email,
    phone:              row.phone ?? null,
    authProvider:       row.auth_provider,
    googleId:           row.google_id ?? null,
    isVerified:         row.is_verified,
    wishlist:           row.wishlist ?? [],
    lastLogin:          row.last_login ?? null,
    role:               row.role,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    // sensitive fields only included when explicitly selected
    password:           row.password,
    refreshToken:       row.refresh_token,
    verificationToken:  row.verification_token,
    verificationExpiry: row.verification_expiry,
    resetCode:          row.reset_code,
    resetCodeExpiry:    row.reset_code_expiry,
  };
};

const User = {
  // Find one user by filter object
  async findOne(filter, { select } = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filter.email)              query = query.eq('email', filter.email);
    if (filter.username)           query = query.eq('username', filter.username);
    if (filter.googleId)           query = query.eq('google_id', filter.googleId);
    if (filter.id)                 query = query.eq('id', filter.id);
    if (filter.role)               query = query.eq('role', filter.role);
    if (filter.verificationToken)  query = query.eq('verification_token', filter.verificationToken);
    if (filter.resetCode)          query = query.eq('reset_code', filter.resetCode);
    if (filter.refreshToken)       query = query.eq('refresh_token', filter.refreshToken);

    // $or: [{ email }, { username }]
    if (filter.$or) {
      const conditions = filter.$or.map((cond) => {
        if (cond.email)    return `email.eq.${cond.email}`;
        if (cond.username) return `username.eq.${cond.username}`;
        return null;
      }).filter(Boolean).join(',');
      query = supabase.from(TABLE).select('*').or(conditions);
    }

    const { data, error } = await query.limit(1).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return toUser(data);
  },

  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return toUser(data);
  },

  async find(filter = {}, { sort, skip = 0, limit = 20, select } = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filter.isVerified !== undefined) query = query.eq('is_verified', filter.isVerified);
    if (filter.authProvider)             query = query.eq('auth_provider', filter.authProvider);
    if (filter.role)                     query = query.eq('role', filter.role);
    if (filter.createdAt?.$gte)          query = query.gte('created_at', filter.createdAt.$gte.toISOString());

    if (sort?.createdAt === -1) query = query.order('created_at', { ascending: false });
    if (sort?.createdAt ===  1) query = query.order('created_at', { ascending: true });

    query = query.range(skip, skip + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toUser);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });

    if (filter.isVerified !== undefined) query = query.eq('is_verified', filter.isVerified);
    if (filter.authProvider)             query = query.eq('auth_provider', filter.authProvider);
    if (filter.role)                     query = query.eq('role', filter.role);
    if (filter.createdAt?.$gte)          query = query.gte('created_at', filter.createdAt.$gte.toISOString());

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data) {
    const hashed = data.password ? await bcrypt.hash(data.password, 12) : null;
    const row = {
      username:           data.username,
      email:              data.email,
      phone:              data.phone ?? null,
      password:           hashed,
      auth_provider:      data.authProvider ?? 'local',
      google_id:          data.googleId ?? null,
      is_verified:        data.isVerified ?? false,
      wishlist:           data.wishlist ?? [],
      last_login:         data.lastLogin ?? null,
      role:               data.role ?? 'user',
    };

    const { data: created, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw new Error(error.message);
    return toUser(created);
  },

  async findByIdAndUpdate(id, updates, { new: returnNew = false } = {}) {
    const row = _toRow(updates);
    const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toUser(data);
  },

  async save(user) {
    // Used when mutating a user object directly then calling save()
    const row = _toRow(user);
    const { data, error } = await supabase.from(TABLE).update(row).eq('id', user.id).select().single();
    if (error) throw new Error(error.message);
    return toUser(data);
  },

  async comparePassword(plainText, hashed) {
    return bcrypt.compare(plainText, hashed);
  },
};

// Convert camelCase app fields → snake_case DB columns
const _toRow = (data) => {
  const row = {};
  if (data.username           !== undefined) row.username            = data.username;
  if (data.email              !== undefined) row.email               = data.email;
  if (data.phone              !== undefined) row.phone               = data.phone;
  if (data.password           !== undefined) row.password            = data.password;
  if (data.refreshToken       !== undefined) row.refresh_token       = data.refreshToken;
  if (data.authProvider       !== undefined) row.auth_provider       = data.authProvider;
  if (data.googleId           !== undefined) row.google_id           = data.googleId;
  if (data.isVerified         !== undefined) row.is_verified         = data.isVerified;
  if (data.verificationToken  !== undefined) row.verification_token  = data.verificationToken;
  if (data.verificationExpiry !== undefined) row.verification_expiry = data.verificationExpiry;
  if (data.resetCode          !== undefined) row.reset_code          = data.resetCode;
  if (data.resetCodeExpiry    !== undefined) row.reset_code_expiry   = data.resetCodeExpiry;
  if (data.wishlist           !== undefined) row.wishlist            = data.wishlist;
  if (data.lastLogin          !== undefined) row.last_login          = data.lastLogin;
  if (data.role               !== undefined) row.role                = data.role;
  return row;
};

export default User;
