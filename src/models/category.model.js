// src/models/category.model.js
import supabase from '../config/db.js';

const TABLE = 'categories';

const toCategory = (row) => {
  if (!row) return null;
  return {
    id:           row.id,
    name:         row.name,
    slug:         row.slug,
    description:  row.description ?? null,
    icon:         row.icon ?? null,
    image:        row.image_url ? { url: row.image_url, publicId: row.image_public_id } : null,
    isActive:     row.is_active,
    productCount: row.product_count,
    sortOrder:    row.sort_order,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
};

const _makeSlug = (name) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const Category = {
  async find(filter = {}, { sort, skip = 0, limit = 100 } = {}) {
    let query = supabase.from(TABLE).select('*');

    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);
    if (filter.slug)                   query = query.eq('slug', filter.slug);

    if (sort?.sortOrder === 1)          query = query.order('sort_order', { ascending: true });
    else if (sort?.productCount === -1) query = query.order('product_count', { ascending: false });
    else                                query = query.order('sort_order', { ascending: true });

    query = query.range(skip, skip + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toCategory);
  },

  async findOne(filter = {}) {
    let query = supabase.from(TABLE).select('*');
    if (filter.slug)     query = query.eq('slug', filter.slug);
    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);
    if (filter.id)       query = query.eq('id', filter.id);
    if (filter.name)     query = query.eq('name', filter.name);

    const { data, error } = await query.limit(1).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return toCategory(data);
  },

  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return toCategory(data);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });
    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data) {
    const slug = data.slug ?? _makeSlug(data.name);
    const row = {
      name:             data.name.trim(),
      slug,
      description:      data.description?.trim() ?? null,
      icon:             data.icon?.trim() ?? null,
      image_url:        data.image?.url ?? null,
      image_public_id:  data.image?.publicId ?? null,
      is_active:        data.isActive ?? true,
      product_count:    data.productCount ?? 0,
      sort_order:       data.sortOrder ?? 0,
    };
    const { data: created, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw new Error(error.message);
    return toCategory(created);
  },

  async insertMany(items) {
    const rows = items.map((item) => ({
      name:          item.name.trim(),
      slug:          item.slug ?? _makeSlug(item.name),
      description:   item.description?.trim() ?? null,
      icon:          item.icon ?? null,
      is_active:     item.isActive ?? true,
      product_count: item.productCount ?? 0,
      sort_order:    item.sortOrder ?? 0,
    }));
    const { data, error } = await supabase.from(TABLE).insert(rows).select();
    if (error) throw new Error(error.message);
    return (data ?? []).map(toCategory);
  },

  async findByIdAndUpdate(id, updates, { new: returnNew = false } = {}) {
    const row = {};
    if (updates.name         !== undefined) { row.name = updates.name.trim(); row.slug = _makeSlug(updates.name); }
    if (updates.slug         !== undefined) row.slug            = updates.slug;
    if (updates.description  !== undefined) row.description     = updates.description?.trim() ?? null;
    if (updates.icon         !== undefined) row.icon            = updates.icon;
    if (updates.isActive     !== undefined) row.is_active       = updates.isActive;
    if (updates.productCount !== undefined) row.product_count   = updates.productCount;
    if (updates.sortOrder    !== undefined) row.sort_order      = updates.sortOrder;
    if (updates.image        !== undefined) {
      row.image_url       = updates.image?.url ?? null;
      row.image_public_id = updates.image?.publicId ?? null;
    }
    // Handle $inc for productCount
    if (updates.$inc?.productCount !== undefined) {
      const { data: current } = await supabase.from(TABLE).select('product_count').eq('id', id).single();
      row.product_count = (current?.product_count ?? 0) + updates.$inc.productCount;
    }

    const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toCategory(data);
  },

  async findByIdAndDelete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async aggregate(pipeline) {
    // Used in dashboard: group by category with productCount sorted desc
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, product_count')
      .eq('is_active', true)
      .order('product_count', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ _id: row.id, name: row.name, productCount: row.product_count }));
  },
};

export default Category;
