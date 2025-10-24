import { Router } from 'express';
import authController from '#controllers/auth.controller.js';
import { protect, restrictTo } from '#middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.put('/update-password', authController.updatePassword);
router.put('/update-details', authController.updateDetails);
router.post('/logout', authController.logout);

// Admin only routes
router.use(restrictTo('admin'));
router.post('/create-admin', authController.createAdmin);
router.get('/all-admins', authController.getAllAdmins);
router.delete('/delete-admin/:id', authController.deleteAdmin);

export default router;
