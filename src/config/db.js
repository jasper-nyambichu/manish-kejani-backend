// src/config/db.js
import mongoose from 'mongoose';
import { logger } from '../shared/utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — attempting reconnect');
      setTimeout(() => connectDB(MAX_RETRIES), RETRY_DELAY);
    });

  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectDB(retries - 1);
    }
    process.exit(1);
  }
};

export default connectDB;