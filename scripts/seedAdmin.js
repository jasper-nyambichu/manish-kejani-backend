// scripts/seedAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../src/models/admin.model.js';
import Category from '../src/models/category.model.js';
import { DEFAULT_CATEGORIES } from '../src/shared/constants/categories.js';
import { logger } from '../src/shared/utils/logger.js';

const seedAdmin = async () => {
  const existing = await Admin.findOne({ username: process.env.SEED_ADMIN_USERNAME });

  if (existing) {
    logger.warn('Admin already exists — skipping');
    return;
  }

  await Admin.create({
    username: process.env.SEED_ADMIN_USERNAME,
    email:    process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });

  logger.info(`Admin created: ${process.env.SEED_ADMIN_USERNAME}`);
};

const seedCategories = async () => {
  const count = await Category.countDocuments();

  if (count > 0) {
    logger.warn(`Categories already exist (${count}) — skipping`);
    return;
  }

  await Category.insertMany(DEFAULT_CATEGORIES);
  logger.info(`${DEFAULT_CATEGORIES.length} categories seeded`);
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');

    await seedAdmin();
    await seedCategories();

    logger.info('Seed complete');
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
