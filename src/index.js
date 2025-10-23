import app from './app.js';
import config from '#config/index.js';
import logger from '#utils/logger.js';
import databaseService from '#config/database.js';

const server = app.listen(config.PORT);

// Immediately invoked async function
(async () => {
  try {
    // Database connection
    const connection = await databaseService.connect();

    logger.info('DATABASE_CONNECTED', {
      meta: {
        CONNECTION_NAME: connection.name,
      },
    });

    logger.info('APPLICATION_STARTED', {
      meta: {
        PORT: config.PORT,
        SERVER_URL: config.SERVER_URL,
      },
    });
  } catch (err) {
    logger.error(`APPLICATION_ERROR`, { meta: err });
    server.close(error => {
      if (error) logger.error(`APPLICATION_ERROR`, { meta: error });

      process.exit(1);
    });
  }
})();
