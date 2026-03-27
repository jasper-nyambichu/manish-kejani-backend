// src/services/product.service.js
// NOTE: field is isNewArrival NOT isNew — isNew is reserved by Mongoose
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { AppError } from '../shared/utils/AppError.js';
import { PRODUCT_STATUS } from '../shared/constants/productStatus.js';
import { deleteImage } from '../config/cloudinary.js';
import { logger } from '../shared/utils/logger.js';

const safeParseJSON = (value, fieldName) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError(`Invalid JSON format for ${fieldName}`, 400);
  }
};

const safeParseFloat = (value, fieldName) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) throw new AppError(`Invalid number for ${fieldName}`, 400);
  return parsed;
};

const toBool = (value) => value === 'true' || value === true;

export const getProducts = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = { $ne: PRODUCT_STATUS.OUT_OF_STOCK };
  }

  if (filters.category)               query.category     = filters.category;
  if (filters.featured === 'true')    query.featured     = true;
  if (filters.isFlashDeal === 'true') query.isFlashDeal  = true;
  if (filters.isNewArrival === 'true') query.isNewArrival = true;

  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
  }

  const sortOptions = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt:  1 },
    price_asc:  { price:      1 },
    price_desc: { price:     -1 },
    rating:     { rating:    -1 },
    popular:    { viewCount: -1 },
  };

  const sort  = sortOptions[filters.sort] ?? sortOptions.newest;
  const page  = Math.max(1, parseInt(filters.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name slug icon')
    .lean();

  if (!product) throw new AppError('Product not found', 404);

  Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch((err) =>
    logger.warn(`viewCount increment failed for ${id}: ${err.message}`)
  );

  return product;
};

export const getProductsByCategory = async (slug, filters = {}) => {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw new AppError('Category not found', 404);
  return getProducts({ ...filters, category: category._id });
};

export const searchProducts = async (query, filters = {}) => {
  if (!query?.trim()) throw new AppError('Search query is required', 400);

  const searchQuery = {
    $text:  { $search: query },
    status: { $ne: PRODUCT_STATUS.OUT_OF_STOCK },
  };

  const page  = Math.max(1, parseInt(filters.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit ?? '20', 10)));
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(searchQuery, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug icon')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(searchQuery),
  ]);

  return {
    products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getFeaturedProducts = async (limit = 8) => {
  return Product.find({ featured: true, status: PRODUCT_STATUS.IN_STOCK })
    .populate('category', 'name slug icon')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const getRelatedProducts = async (productId, limit = 4) => {
  const product = await Product.findById(productId).lean();
  if (!product) throw new AppError('Product not found', 404);

  return Product.find({
    category: product.category,
    _id:      { $ne: productId },
    status:   PRODUCT_STATUS.IN_STOCK,
  })
    .populate('category', 'name slug icon')
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
};

export const createProduct = async (data, files = []) => {
  const {
    name, description, price, originalPrice,
    category, subcategory, specifications,
    tags, sku, status, featured,
    isFlashDeal, isNewArrival, imageUrl,
  } = data;

  if (!name || !description || !price || !category) {
    throw new AppError('Name, description, price and category are required', 400);
  }

  const categoryExists = await Category.findById(category).lean();
  if (!categoryExists) throw new AppError('Category not found', 404);

  let images = [];
  if (files.length > 0) {
    images = files.map((file) => ({
      url:      file.path,
      publicId: file.filename,
    }));
  } else if (imageUrl) {
    images = [{ url: imageUrl, publicId: `external_${Date.now()}` }];
  }

  const product = await Product.create({
    name:           name.trim(),
    description:    description.trim(),
    price:          safeParseFloat(price, 'price'),
    originalPrice:  originalPrice ? safeParseFloat(originalPrice, 'originalPrice') : undefined,
    category,
    subcategory:    subcategory?.trim(),
    images,
    specifications: safeParseJSON(specifications, 'specifications'),
    tags:           safeParseJSON(tags, 'tags'),
    sku:            sku?.trim(),
    status:         status ?? PRODUCT_STATUS.IN_STOCK,
    featured:       toBool(featured),
    isFlashDeal:    toBool(isFlashDeal),
    isNewArrival:   toBool(isNewArrival),
  });

  Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } }).catch((err) =>
    logger.warn(`productCount increment failed: ${err.message}`)
  );

  return Product.findById(product._id)
    .populate('category', 'name slug icon')
    .lean();
};

export const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  const updates = { ...data };

  if (updates.price)          updates.price          = safeParseFloat(updates.price, 'price');
  if (updates.originalPrice)  updates.originalPrice  = safeParseFloat(updates.originalPrice, 'originalPrice');
  if (updates.specifications) updates.specifications = safeParseJSON(updates.specifications, 'specifications');
  if (updates.tags)           updates.tags           = safeParseJSON(updates.tags, 'tags');
  if (updates.name)           updates.name           = updates.name.trim();
  if (updates.description)    updates.description    = updates.description.trim();
  if (updates.featured     !== undefined) updates.featured     = toBool(updates.featured);
  if (updates.isFlashDeal  !== undefined) updates.isFlashDeal  = toBool(updates.isFlashDeal);
  if (updates.isNewArrival !== undefined) updates.isNewArrival = toBool(updates.isNewArrival);

  if (files.length > 0) {
    const newImages = files.map((file) => ({
      url:      file.path,
      publicId: file.filename,
    }));
    updates.images = [...(product.images ?? []), ...newImages].slice(0, 5);
  } else if (updates.imageUrl) {
    const urlImage = { url: updates.imageUrl, publicId: `external_${Date.now()}` };
    updates.images = [...(product.images ?? []), urlImage].slice(0, 5);
    delete updates.imageUrl;
  }

  if (updates.category && updates.category !== product.category.toString()) {
    const categoryExists = await Category.findById(updates.category).lean();
    if (!categoryExists) throw new AppError('Category not found', 404);

    Promise.all([
      Category.findByIdAndUpdate(product.category,  { $inc: { productCount: -1 } }),
      Category.findByIdAndUpdate(updates.category,  { $inc: { productCount:  1 } }),
    ]).catch((err) => logger.warn(`productCount sync failed: ${err.message}`));
  }

  return Product.findByIdAndUpdate(id, updates, {
    new:           true,
    runValidators: true,
  })
    .populate('category', 'name slug icon')
    .lean();
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  await Promise.allSettled(
    product.images
      .filter((img) => !img.publicId.startsWith('external_'))
      .map((img) => deleteImage(img.publicId))
  );

  await Promise.all([
    Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }),
    Product.findByIdAndDelete(id),
  ]);
};

export const deleteProductImage = async (productId, publicId) => {
  if (!publicId) throw new AppError('Image publicId is required', 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const imageIndex = product.images.findIndex((img) => img.publicId === publicId);
  if (imageIndex === -1) throw new AppError('Image not found on this product', 404);

  if (!publicId.startsWith('external_')) {
    await deleteImage(publicId);
  }

  product.images.splice(imageIndex, 1);
  await product.save({ validateBeforeSave: false });

  return product;
};

export const toggleFeatured = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  product.featured = !product.featured;
  await product.save({ validateBeforeSave: false });

  return product;
};

export const updateStockStatus = async (id, status) => {
  if (!status) throw new AppError('Status is required', 400);

  if (!Object.values(PRODUCT_STATUS).includes(status)) {
    throw new AppError(
      `Invalid stock status. Valid values: ${Object.values(PRODUCT_STATUS).join(', ')}`,
      400
    );
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).lean();

  if (!product) throw new AppError('Product not found', 404);
  return product;
};
