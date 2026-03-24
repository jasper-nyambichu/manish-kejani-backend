// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { logger } from '../shared/utils/logger.js';

const buildLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit hit — ip: ${req.ip} path: ${req.originalUrl}`);
      res.status(429).json({ success: false, message });
    },
  });

export const publicLimiter = buildLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests. Please try again later.'
);

export const authLimiter = buildLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please wait 15 minutes.'
);

export const uploadLimiter = buildLimiter(
  10 * 60 * 1000,
  20,
  'Too many upload requests. Please slow down.'
);