// src/config/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';

import connectDB from './db.js';
import passport from './passport.js';
import { logger } from '../shared/utils/logger.js';
import { publicLimiter } from '../middleware/rateLimiter.js';
import errorHandler from '../middleware/errorHandler.js';
import notFound from '../middleware/notFound.js';

import productRoutes from '../routes/public/product.routes.js';
import categoryRoutes from '../routes/public/category.routes.js';
import reviewRoutes from '../routes/public/review.routes.js';
import authRoutes from '../routes/public/auth.routes.js';
import adminAuthRoutes from '../routes/admin/adminAuth.routes.js';
import adminProductRoutes from '../routes/admin/adminProduct.routes.js';
import adminCategoryRoutes from '../routes/admin/adminCategory.routes.js';
import adminPromotionRoutes from '../routes/admin/adminPromotion.routes.js';
import adminDashboardRoutes from '../routes/admin/adminDashboard.routes.js';
import whatsappRoutes from '../routes/public/whatsapp.routes.js';

const createApp = async () => {
  await connectDB();

  const app = express();

  app.use(helmet());

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'fallback_secret_change_this',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 5 * 60 * 1000 },
    })
  );

  app.use(passport.initialize());

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  // NOTE: Do NOT use app.use(mongoSanitize()) — Express 5 makes req.query read-only
  // and mongoSanitize tries to overwrite it, causing a 500 on every request.
  // Instead, sanitize body and params directly.
  app.use((_req, _res, next) => {
    if (_req.body)   mongoSanitize.sanitize(_req.body);
    if (_req.params) mongoSanitize.sanitize(_req.params);
    next();
  });
  app.use(compression());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', publicLimiter);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/reviews', reviewRoutes);
  app.use('/api/v1/auth', authRoutes);

  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/admin/products', adminProductRoutes);
  app.use('/api/admin/categories', adminCategoryRoutes);
  app.use('/api/admin/promotions', adminPromotionRoutes);
  app.use('/api/admin/dashboard', adminDashboardRoutes);
  app.use('/api/v1/whatsapp', whatsappRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;