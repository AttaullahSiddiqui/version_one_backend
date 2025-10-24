import { ENV } from '#config/index.js';
import { EApplicationEnvironment } from '../constants/application.js';
import responseMessage from '../constants/responseMessage.js';
import logger from '#utils/logger.js';

export default (err, req, errStatusCode = 500) => {
  let error = err.message || err;
  const errorObj = {
    success: true,
    statusCode: errStatusCode,
    request: {
      ip: req.ip || null,
      method: req.method,
      url: req.originalUrl,
    },
    message: error ? error : responseMessage.SOMETHING_WENT_WRONG,
    data: null,
    trace: err instanceof Error ? { error: err.stack } : null,
  };

  logger.info('ERROR', { meta: errorObj });

  if (ENV === EApplicationEnvironment.PRODUCTION) {
    delete errorObj.request.ip;
    delete errorObj.trace;
  }

  return errorObj;
};
