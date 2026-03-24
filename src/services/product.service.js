// src/services/product.service.js
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { AppError } from '../shared/utils/AppError.js';
import { PRODUCT_STATUS } from '../shared/constants/productStatus.js';
import { deleteImage } from '../config/cloudinary.js';

export const getProducts = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = { $ne: PRODUCT_STATUS.OUT_OF_STOCK };
  }

  if (filters.category)    query.category    = filters.category;
  if (filters.featured === 'true') query.featured   = true;
  if (filters.isFlashDeal === 'true') query.isFlashDeal = true;
  if (filters.isNew === 'true')       query.isNew      = true;

  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
  }

  const sortOptions = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt: 1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { rating: -1 },
    popular:    { viewCount: -1 },
  };

  const sort  = sortOptions[filters.sort] ?? sortOptions.newest;
  const page  = parseInt(filters.page  ?? '1',  10);
  const limit = parseInt(filters.limit ?? '20', 10);
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name slug icon');

  if (!product) throw new AppError('Product not found', 404);

  await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  return product;
};

export const getProductsByCategory = async (slug, filters = {}) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new AppError('Category not found', 404);

  return getProducts({ ...filters, category: category._id });
};

export const searchProducts = async (query, filters = {}) => {
  if (!query?.trim()) throw new AppError('Search query is required', 400);

  const searchQuery = {
    $text:  { $search: query },
    status: { $ne: PRODUCT_STATUS.OUT_OF_STOCK },
  };

  const page  = parseInt(filters.page  ?? '1',  10);
  const limit = parseInt(filters.limit ?? '20', 10);
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(searchQuery, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug icon')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit),
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
    .limit(limit);
};

export const getRelatedProducts = async (productId, limit = 4) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  return Product.find({
    category: product.category,
    _id:      { $ne: productId },
    status:   PRODUCT_STATUS.IN_STOCK,
  })
    .populate('category', 'name slug icon')
    .sort({ rating: -1 })
    .limit(limit);
};

export const createProduct = async (data, files = []) => {
  const {
    name, description, price, originalPrice,
    category, subcategory, specifications,
    tags, sku, status, featured,
    isFlashDeal, isNew, imageUrl,
  } = data;

  if (!name || !description || !price || !category) {
    throw new AppError('Name, description, price and category are required', 400);
  }

  const categoryExists = await Category.findById(category);
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
    name,
    description,
    price:           parseFloat(price),
    originalPrice:   originalPrice ? parseFloat(originalPrice) : undefined,
    category,
    subcategory,
    images,
    specifications:  specifications ? JSON.parse(specifications) : [],
    tags:            tags ? JSON.parse(tags) : [],
    sku,
    status:          status ?? PRODUCT_STATUS.IN_STOCK,
    featured:        featured === 'true' || featured === true,
    isFlashDeal:     isFlashDeal === 'true' || isFlashDeal === true,
    isNew:           isNew === 'true' || isNew === true,
  });

  await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

  return Product.findById(product._id).populate('category', 'name slug icon');
};

export const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  const updates = { ...data };

  if (updates.price)         updates.price         = parseFloat(updates.price);
  if (updates.originalPrice) updates.originalPrice = parseFloat(updates.originalPrice);
  if (updates.specifications) updates.specifications = JSON.parse(updates.specifications);
  if (updates.tags)           updates.tags           = JSON.parse(updates.tags);
  if (updates.featured !== undefined)    updates.featured    = updates.featured === 'true' || updates.featured === true;
  if (updates.isFlashDeal !== undefined) updates.isFlashDeal = updates.isFlashDeal === 'true' || updates.isFlashDeal === true;
  if (updates.isNew !== undefined)       updates.isNew       = updates.isNew === 'true' || updates.isNew === true;

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
    const categoryExists = await Category.findById(updates.category);
    if (!categoryExists) throw new AppError('Category not found', 404);

    await Promise.all([
      Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }),
      Category.findByIdAndUpdate(updates.category,  { $inc: { productCount:  1 } }),
    ]);
  }

  const updated = await Product.findByIdAndUpdate(id, updates, {
    new:            true,
    runValidators:  true,
  }).populate('category', 'name slug icon');

  return updated;
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  for (const image of product.images) {
    if (!image.publicId.startsWith('external_')) {
      await deleteImage(image.publicId);
    }
  }

  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
  await Product.findByIdAndDelete(id);
};

export const deleteProductImage = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const imageIndex = product.images.findIndex((img) => img.publicId === publicId);
  if (imageIndex === -1) throw new AppError('Image not found', 404);

  if (!publicId.startsWith('external_')) {
    await deleteImage(publicId);
  }

  product.images.splice(imageIndex, 1);
  await product.save();

  return product;
};

export const toggleFeatured = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  product.featured = !product.featured;
  await product.save();

  return product;
};

export const updateStockStatus = async (id, status) => {
  if (!Object.values(PRODUCT_STATUS).includes(status)) {
    throw new AppError('Invalid stock status', 400);
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!product) throw new AppError('Product not found', 404);
  return product;
};