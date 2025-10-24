import logger from '#utils/logger.js';

export default (err, req, res, next) => {
  logger.error('GLOBAL_ERROR', { meta: err });
  res.status(err.statusCode).json(err);
};
