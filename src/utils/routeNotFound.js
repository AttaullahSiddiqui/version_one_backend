import logger from '#utils/logger.js';

export const routeNotFound = (req, res, next) => {
  const error = new Error('Not found');
  logger.error(error);

  res.status(404).json({
    error: {
      message: error.message,
    },
  });
};
