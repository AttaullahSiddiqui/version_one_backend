import User from '../models/user.model.js';
import httpError from '#utils/httpError.js';
import httpResponse from '#utils/httpResponse.js';
import sendEmail from '#utils/email.js';
import cookies from '#utils/cookies.js';
import {
  generateResetToken,
  generateTokenExpiry,
  isTokenExpired,
  sanitizeUserData,
} from '#utils/crypto.js';
import cloudinary from '#services/cloudinary.service.js';
import { cleanupTemp } from '#middleware/multer.middleware.js';

export default {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        httpError(next, 'Please provide email and password', req, 400);
        return;
      }

      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        httpError(next, 'Invalid email or password', req, 401);
        return;
      }

      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      const token = user.generateAuthToken();

      const sanitizedUser = sanitizeUserData(user);

      httpResponse(req, res, 200, 'Login successful', {
        user: sanitizedUser,
        token,
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  createAdmin: async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        await cleanupTemp(req.file); // Clean up if validation fails
        httpError(next, 'Please provide all required fields', req, 400);
        return;
      }

      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        await cleanupTemp(req.file);
        httpError(next, 'Email already registered', req, 400);
        return;
      }

      let avatarData = {
        public_id: 'default_avatar_id',
        url: 'https://your-default-avatar-url.com/default.png',
      };

      if (req.file) {
        try {
          avatarData = await cloudinary.upload(req.file, 'websiteavatars');
        } catch (error) {
          httpError(next, 'Avatar upload failed', req, 400);
          return;
        } finally {
          await cleanupTemp(req.file);
        }
      }

      const admin = await User.create({
        name,
        email,
        password,
        role: role || 'admin',
        avatar: avatarData,
      });

      const sanitizedAdmin = sanitizeUserData(admin);

      httpResponse(req, res, 201, 'Admin created successfully', {
        admin: sanitizedAdmin,
      });
    } catch (error) {
      await cleanupTemp(req.file);
      httpError(next, error, req, 500);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        httpError(next, 'User not found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'User details retrieved', user);
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  updatePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        httpError(next, 'Please provide both passwords', req, 400);
        return;
      }

      if (currentPassword == newPassword) {
        httpError(next, 'Please choose different password', req, 400);
        return;
      }

      const user = await User.findById(req.user.id).select('+password');

      if (!user) {
        httpError(next, 'User not found', req, 404);
        return;
      }

      if (!(await user.comparePassword(currentPassword))) {
        httpError(next, 'Current password is incorrect', req, 401);
        return;
      }

      user.password = newPassword;
      await user.save();

      const token = user.generateAuthToken();
      cookies.set(res, 'token', token);

      httpResponse(req, res, 200, 'Password updated successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  updateDetails: async (req, res, next) => {
    try {
      const { name, email } = req.body;
      const fieldsToUpdate = { ...(name && { name }), ...(email && { email }) };

      if (Object.keys(fieldsToUpdate).length === 0) {
        httpError(next, 'Please provide fields to update', req, 400);
        return;
      }

      const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        httpError(next, 'User not found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'User details updated', user);
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        httpError(next, 'Please provide an email', req, 400);
        return;
      }

      const user = await User.findOne({ email });

      if (!user) {
        httpError(next, 'No user found with that email', req, 404);
        return;
      }

      const { resetToken, hashedToken } = generateResetToken();
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = generateTokenExpiry(30);
      await user.save({ validateBeforeSave: false });

      try {
        await sendEmail({
          email: user.email,
          subject: 'Password Reset Token',
          message: `Your password reset token is: ${resetToken}`,
        });

        httpResponse(req, res, 200, 'Reset token sent to email');
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        httpError(next, 'Email could not be sent', req, 500);
      }
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        httpError(next, 'Invalid or expired token', req, 400);
        return;
      }

      if (!req.body.password) {
        httpError(next, 'Please provide new password', req, 400);
        return;
      }

      if (isTokenExpired(user.resetPasswordExpire)) {
        httpError(next, 'Reset token has expired', req, 400);
        return;
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const token = user.generateAuthToken();
      cookies.set(res, 'token', token);

      httpResponse(req, res, 200, 'Password reset successful');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getAllAdmins: async (req, res, next) => {
    try {
      const admins = await User.find({ role: 'admin' }).select(
        '-resetPasswordToken -resetPasswordExpire -password'
      );

      httpResponse(req, res, 200, 'Admins retrieved successfully', admins);
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  deleteAdmin: async (req, res, next) => {
    try {
      const admin = await User.findOne({
        _id: req.params.id,
        role: 'admin',
      });

      if (!admin) {
        httpError(next, 'Admin not found', req, 404);
        return;
      }

      if (admin._id.toString() === req.user.id) {
        httpError(next, 'You cannot delete your own account', req, 400);
        return;
      }

      await admin.deleteOne();

      httpResponse(req, res, 200, 'Admin deleted successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
  logout: async (req, res, next) => {
    try {
      cookies.clear(res, 'token');
      httpResponse(req, res, 200, 'Logged out successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
};
