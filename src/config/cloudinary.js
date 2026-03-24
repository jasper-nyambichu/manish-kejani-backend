// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import CloudinaryStorage from 'multer-storage-cloudinary';
import multer from 'multer';
import { logger } from '../shared/utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'manish-kejani/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only jpg, png and webp images are allowed'));
  },
});

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Cloudinary image deleted: ${publicId}`);
  } catch (err) {
    logger.error(`Cloudinary delete failed: ${err.message}`);
  }
};

export default cloudinary;