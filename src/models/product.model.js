// src/models/product.model.js
import supabase from '../config/db.js';

const TABLE = 'products';

const toProduct = (row, categoryRow = null) => {
  if (!row) return null;
  const category = categoryRow
    ? { id: categoryRow.id, name: categoryRow.name, slug: categoryRow.slug, icon: categoryRow.icon }
    : row.category_id;

  return {
    id:              row.id,
    _id:             row.id,
    name:            row.name,
    description:     row.description,
    price:           parseFloat(row.price),
    originalPrice:   row.original_price ? parseFloat(row.original_price) : null,
    discountPercent: row.discount_percent,
    category:        category,
    subcategory:     row.subcategory ?? null,
    images:          row.images ?? [],
    image:           row.images?.[0]?.url ?? '',
    status:          row.status,
    featured:        row.featured,
    isFlashDeal:     row.is_flash_deal,
    isNewArrival:    row.is_new_arrival,
    rating:          parseFloat(row.rating),
    reviews:         row.reviews,
    specifications:  row.specifications ?? [],
    tags:            row.tags ?? [],
    sku:             row.sku ?? null,
    viewCount:       row.view_count,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
};

const _calcDiscount = (price, originalPrice) => {
  if (!originalPrice || !price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const Product = {
  async find(filter = {}, { sort, skip = 0, limit = 20, populate } = {}) {
    let query = supabase
      .from(TABLE)
      .select('*, categories!products_category_id_fkey(id, name, slug, icon)');

    if (filter.status)                    query = query.eq('status', filter.status);
    if (filter.excludeStatus)             query = query.neq('status', filter.excludeStatus);
    if (filter.category_id)               query = query.eq('category_id', filter.category_id);
    if (filter.featured === true)         query = query.eq('featured', true);
    if (filter.is_flash_deal === true)    query = query.eq('is_flash_deal', true);
    if (filter.is_new_arrival === true)   query = query.eq('is_new_arrival', true);
    if (filter.price?.$gte !== undefined) query = query.gte('price', filter.price.$gte);
    if (filter.price?.$lte !== undefined) query = query.lte('price', filter.price.$lte);
    if (filter.excludeId)                 query = query.neq('id', filter.excludeId);

    const sortMap = {
      newest:     ['created_at', false],
      oldest:     ['created_at', true],
      price_asc:  ['price', true],
      price_desc: ['price', false],
      rating:     ['rating', false],
      popular:    ['view_count', false],
    };

    if (sort?._key && sortMap[sort._key]) {
      const [col, asc] = sortMap[sort._key];
      query = query.order(col, { ascending: asc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(skip, skip + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toProduct(row, row.categories));
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, categories!products_category_id_fkey(id, name, slug, icon)')
      .eq('id', id)
      .limit(1);
    if (error) throw new Error(error.message);
    const row = data?.[0] ?? null;
    return toProduct(row, row?.categories);
  },

  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });

    if (filter.status)            query = query.eq('status', filter.status);
    if (filter.excludeStatus)     query = query.neq('status', filter.excludeStatus);
    if (filter.featured === true) query = query.eq('featured', true);
    if (filter.category_id)       query = query.eq('category_id', filter.category_id);

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(data) {
    const discountPercent = _calcDiscount(data.price, data.originalPrice);
    const row = {
      name:             data.name,
      description:      data.description,
      price:            data.price,
      original_price:   data.originalPrice ?? null,
      discount_percent: discountPercent,
      category_id:      data.category,
      subcategory:      data.subcategory ?? null,
      images:           data.images ?? [],
      status:           data.status ?? 'in_stock',
      featured:         data.featured ?? false,
      is_flash_deal:    data.isFlashDeal ?? false,
      is_new_arrival:   data.isNewArrival ?? false,
      specifications:   data.specifications ?? [],
      tags:             data.tags ?? [],
      sku:              data.sku ?? null,
    };
    const { data: created, error } = await supabase.from(TABLE).insert(row).select(
      '*, categories!products_category_id_fkey(id, name, slug, icon)'
    );
    if (error) throw new Error(error.message);
    const c = created?.[0] ?? null;
    return toProduct(c, c?.categories);
  },

  async findByIdAndUpdate(id, updates, { new: returnNew = false } = {}) {
    const row = {};
    if (updates.name            !== undefined) row.name             = updates.name;
    if (updates.description     !== undefined) row.description      = updates.description;
    if (updates.price           !== undefined) row.price            = updates.price;
    if (updates.originalPrice   !== undefined) row.original_price   = updates.originalPrice;
    if (updates.category        !== undefined) row.category_id      = updates.category;
    if (updates.subcategory     !== undefined) row.subcategory      = updates.subcategory;
    if (updates.images          !== undefined) row.images           = updates.images;
    if (updates.status          !== undefined) row.status           = updates.status;
    if (updates.featured        !== undefined) row.featured         = updates.featured;
    if (updates.isFlashDeal     !== undefined) row.is_flash_deal    = updates.isFlashDeal;
    if (updates.isNewArrival    !== undefined) row.is_new_arrival   = updates.isNewArrival;
    if (updates.specifications  !== undefined) row.specifications   = updates.specifications;
    if (updates.tags            !== undefined) row.tags             = updates.tags;
    if (updates.sku             !== undefined) row.sku              = updates.sku;
    if (updates.rating          !== undefined) row.rating           = updates.rating;
    if (updates.reviews         !== undefined) row.reviews          = updates.reviews;

    if (updates.$inc?.viewCount) {
      const { data: cur } = await supabase.from(TABLE).select('view_count').eq('id', id).limit(1);
      row.view_count = (cur?.[0]?.view_count ?? 0) + updates.$inc.viewCount;
    }

    if (row.price !== undefined || row.original_price !== undefined) {
      const { data: cur } = await supabase.from(TABLE).select('price, original_price').eq('id', id).limit(1);
      const p  = row.price          ?? cur?.[0]?.price;
      const op = row.original_price ?? cur?.[0]?.original_price;
      row.discount_percent = _calcDiscount(p, op);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select('*, categories!products_category_id_fkey(id, name, slug, icon)');
    if (error) throw new Error(error.message);
    const updated = data?.[0] ?? null;
    return toProduct(updated, updated?.categories);
  },

  async findByIdAndDelete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async search(query, { skip = 0, limit = 20 } = {}) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, categories!products_category_id_fkey(id, name, slug, icon)')
      .neq('status', 'out_of_stock')
      .textSearch('name', query, { type: 'websearch', config: 'english' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toProduct(row, row.categories));
  },

  async searchCount(query) {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .neq('status', 'out_of_stock')
      .textSearch('name', query, { type: 'websearch', config: 'english' });
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

export default Product;
