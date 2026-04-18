// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { logger } from '../shared/utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memoryStorage so multer buffers the file in memory first
const memStorage = multer.memoryStorage();

const multerUpload = multer({
  storage:    memStorage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only jpg, png and webp images are allowed'));
  },
});

// Upload a single buffer to Cloudinary and return { url, publicId }
const uploadBufferToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-')}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'manish-kejani/products',
        public_id:     publicId,
        resource_type: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
};

/** After `upload.single('bannerImage')` — promotes buffer to Cloudinary URL for promotion banners. */
export const uploadSingleBannerToCloudinary = async (req, _res, next) => {
  try {
    if (!req.file?.buffer) return next();
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
    req.file = { ...req.file, path: uploaded.url, filename: uploaded.publicId };
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware: runs after multer, uploads all buffered files to Cloudinary
// Attaches results back to req.files as { path, filename } for compatibility
export const uploadToCloudinary = async (req, _res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const uploaded = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer, file.originalname))
    );

    // Attach cloudinary results back onto req.files in the format product.service.js expects
    req.files = req.files.map((file, i) => ({
      ...file,
      path:     uploaded[i].url,
      filename: uploaded[i].publicId,
    }));

    next();
  } catch (err) {
    logger.error(`Cloudinary upload failed: ${err.message}`);
    next(err);
  }
};

export const upload = multerUpload;

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Cloudinary image deleted: ${publicId}`);
  } catch (err) {
    logger.error(`Cloudinary delete failed: ${err.message}`);
  }
};

export default cloudinary;
