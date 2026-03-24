// src/middleware/errorHandler.js
import { logger } from '../shared/utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  logger.error({
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  const statusCode = err.statusCode ?? 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong'
      : err.message;

  res.status(statusCode).json({ success: false, message });
};

export default errorHandler;