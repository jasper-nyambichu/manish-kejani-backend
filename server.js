// server.js
import 'dotenv/config';
import createApp from './src/config/app.js';
import { connectDB } from './src/config/db.js';
import { logger } from './src/shared/utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const start = async () => {
  try {
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    });

    // Connect DB after server is already listening
    connectDB();

    // Keep-alive ping — prevents Render free tier from spinning down
    // Pings the health endpoint every 14 minutes
    // if (process.env.NODE_ENV === 'production') {
    //   const BACKEND_URL = process.env.BACKEND_URL ?? `https://manishkejanibackend-z541ccga.b4a.run`;
    //   setInterval(async () => {
    //     try {
    //       const res = await fetch(`${BACKEND_URL}/health`);
    //       logger.info(`Keep-alive ping: ${res.status}`);
    //     } catch (err) {
    //       logger.warn(`Keep-alive ping failed: ${err.message}`);
    //     }
    //   }, 14 * 60 * 1000); // every 14 minutes
    // }

    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled rejection: ${reason}`);
      shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught exception: ${err.message}`);
      shutdown('uncaughtException');
    });

  } catch (err) {
    logger.error(`Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();