// src/models/promotion.model.js
import supabase from '../config/db.js';

const TABLE = 'promotions';

const toPromotion = (row) => {
  if (!row) return null;
  return {
    id:              row.id,
    _id:             row.id,
    title:           row.title,
    description:     row.description ?? null,
    discountPercent: row.discount_percent,
    products:        row.products ?? [],
    categories:      row.categories ?? [],
    startDate:       row.start_date,
    endDate:         row.end_date,
    isActive:        row.is_active,
    bannerImage:     row.banner_url ? { url: row.banner_url, publicId: row.banner_public_id } : null,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
};

const Promotion = {
  async find(filter = {}, { sort } = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filter.isActive !== undefined)  query = query.eq('is_active', filter.isActive);
    if (filter.startDate?.$lte)         query = query.lte('start_date', filter.startDate.$lte.toISOString());
    if (filter.endDate?.$gte)           query = query.gte('end_date', filter.endDate.$gte.toISOString());

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toPromotion);
  },

  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return toPromotion(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });
    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);
    if (filter.startDate?.$lte)        query = query.lte('start_date', filter.startDate.$lte.toISOString());
    if (filter.endDate?.$gte)          query = query.gte('end_date', filter.endDate.$gte.toISOString());
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data) {
    const row = {
      title:            data.title,
      description:      data.description ?? null,
      discount_percent: data.discountPercent,
      products:         data.products ?? [],
      categories:       data.categories ?? [],
      start_date:       data.startDate,
      end_date:         data.endDate,
      is_active:        data.isActive ?? true,
      banner_url:       data.bannerImage?.url ?? null,
      banner_public_id: data.bannerImage?.publicId ?? null,
    };
    const { data: created, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw new Error(error.message);
    return toPromotion(created);
  },

  async findByIdAndUpdate(id, updates, { new: returnNew = false } = {}) {
    const row = {};
    if (updates.title            !== undefined) row.title            = updates.title;
    if (updates.description      !== undefined) row.description      = updates.description;
    if (updates.discountPercent  !== undefined) row.discount_percent = updates.discountPercent;
    if (updates.products         !== undefined) row.products         = updates.products;
    if (updates.categories       !== undefined) row.categories       = updates.categories;
    if (updates.startDate        !== undefined) row.start_date       = updates.startDate;
    if (updates.endDate          !== undefined) row.end_date         = updates.endDate;
    if (updates.isActive         !== undefined) row.is_active        = updates.isActive;
    if (updates.bannerImage      !== undefined) {
      row.banner_url       = updates.bannerImage?.url ?? null;
      row.banner_public_id = updates.bannerImage?.publicId ?? null;
    }

    const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toPromotion(data);
  },

  async findByIdAndDelete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export default Promotion;
