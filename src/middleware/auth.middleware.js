import logger from '#utils/logger.js';
import jwtToken from '#utils/jwt.js';
import { cleanupTemp } from './multer.middleware.js';

export const protect = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided',
      });
    }

    const decoded = jwtToken.verify(token);
    req.user = decoded;

    logger.info(`User authenticated: ${decoded.email} (${decoded.role})`);
    next();
  } catch (e) {
    logger.error('Authentication error:', e);

    if (e.message === 'Failed to authenticate token') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired token',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during authentication',
    });
  }
};

export const validatePassKey = key => {
  return async (req, res, next) => {
    try {
      if (key.trim() !== req.body.passKey.trim()) {
        logger.warn(
          `Wrong passkey provided for creating admin: ${req.body.passKey}`
        );
        if (req.file) await cleanupTemp(req.file);
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (e) {
      logger.error('Role verification error:', e);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error during role verification',
      });
    }
  };
};
