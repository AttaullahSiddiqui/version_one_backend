import logger from '#utils/logger.js';

export default (err, req, res, next) => {
  logger.error('GLOBAL_ERROR', { meta: err });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(err);
};
