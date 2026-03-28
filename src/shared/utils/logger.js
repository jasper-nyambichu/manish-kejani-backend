// src/shared/utils/logger.js
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack ? `${ts} [${level}] ${message}\n${stack}` : `${ts} [${level}] ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  // NOTE: No file transports in production — Render has a read-only filesystem
  // All logs go to console (stdout) which Render captures automatically
  transports: [
    new winston.transports.Console(),
  ],
});