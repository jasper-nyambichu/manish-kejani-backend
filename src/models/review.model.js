// src/models/review.model.js
import supabase from '../config/db.js';

const TABLE = 'reviews';

const toReview = (row) => {
  if (!row) return null;
  return {
    id:        row.id,
    _id:       row.id,
    product:   row.product_id,
    user:      row.users ? { id: row.users.id, username: row.users.username } : row.user_id,
    rating:    row.rating,
    comment:   row.comment,
    verified:  row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const Review = {
  async find(filter = {}, { sort, skip = 0, limit = 10 } = {}) {
    let query = supabase
      .from(TABLE)
      .select('*, users(id, username)');

    if (filter.product_id) query = query.eq('product_id', filter.product_id);
    if (filter.user_id)    query = query.eq('user_id', filter.user_id);

    query = query.order('created_at', { ascending: false });
    query = query.range(skip, skip + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toReview);
  },

  async findOne(filter = {}) {
    let query = supabase.from(TABLE).select('*, users(id, username)');
    if (filter.product_id) query = query.eq('product_id', filter.product_id);
    if (filter.user_id)    query = query.eq('user_id', filter.user_id);
    if (filter.id)         query = query.eq('id', filter.id);

    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    return toReview(data?.[0] ?? null);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, users(id, username)')
      .eq('id', id)
      .limit(1);
    if (error) throw new Error(error.message);
    return toReview(data?.[0] ?? null);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });
    if (filter.product_id) query = query.eq('product_id', filter.product_id);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data) {
    const row = {
      product_id: data.product,
      user_id:    data.user,
      rating:     data.rating,
      comment:    data.comment,
      verified:   data.verified ?? false,
    };
    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*, users(id, username)');
    if (error) throw new Error(error.message);
    return toReview(created?.[0] ?? null);
  },

  async findByIdAndUpdate(id, updates) {
    const row = {};
    if (updates.rating  !== undefined) row.rating  = updates.rating;
    if (updates.comment !== undefined) row.comment = updates.comment;

    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*, users(id, username)');
    if (error) throw new Error(error.message);
    return toReview(data?.[0] ?? null);
  },

  async findByIdAndDelete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Replaces Mongoose aggregate for rating recalculation
  async aggregate(productId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('rating')
      .eq('product_id', productId);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [{ avgRating: 0, count: 0 }];
    const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
    return [{ avgRating: avg, count: data.length }];
  },
};

export default Review;
