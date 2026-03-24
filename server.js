// server.js
import 'dotenv/config';
import createApp from './src/config/app.js';
import { logger } from './src/shared/utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const start = async () => {
  try {
    const app = await createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    });

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