import httpResponse from '#utils/httpResponse.js';
import responseMessage from '#constants/responseMessage.js';
import httpError from '#utils/httpError.js';
import quicker from '#utils/quicker.js';
import Blog from '../models/blog.model.js';
import Name from '../models/name.model.js';
import User from '../models/user.model.js';

export default {
  self: (req, res, next) => {
    try {
      httpResponse(req, res, 200, responseMessage.SUCCESS);
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  health: (req, res, next) => {
    try {
      const healthData = {
        application: quicker.getApplicationHealth(),
        system: quicker.getSystemHealth(),
        timeStamp: Date.now(),
      };
      httpResponse(req, res, 200, responseMessage.SUCCESS, healthData);
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  // Admin dashboard counts: total blogs, names and users (protected)
  getAdminCounts: async (req, res, next) => {
    try {
      // Ensure the requester is an admin
      if (!req.user || req.user.role !== 'admin') {
        httpError(next, 'Access denied', req, 403);
        return;
      }

      const [totalBlogs, totalNames, totalUsers] = await Promise.all([
        Blog.countDocuments(),
        Name.countDocuments(),
        User.countDocuments(),
      ]);

      httpResponse(
        req,
        res,
        200,
        'Admin dashboard counts retrieved successfully',
        { totalBlogs, totalNames, totalUsers }
      );
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },
};
