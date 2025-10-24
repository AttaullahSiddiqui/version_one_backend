import { ENV } from '#config/index.js';
import { EApplicationEnvironment } from '../constants/application.js';
import logger from '#utils/logger.js';

export default (req, res, resStatusCode, resMessage, data = null) => {
  const response = {
    success: true,
    statusCode: resStatusCode,
    request: {
      ip: req.ip || null,
      method: req.method,
      url: req.originalUrl,
    },
    message: resMessage,
    data,
  };

  // logger.info('CONTROLLER_RESPONSE', { meta: response });

  if (ENV === EApplicationEnvironment.PRODUCTION) delete response.request.ip;

  res.status(resStatusCode).json(response);
};
