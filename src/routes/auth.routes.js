import { Router } from 'express';
import { upload } from '#middleware/multer.middleware.js';
import authController from '#controllers/auth.controller.js';
import { protect, validatePassKey } from '#middleware/auth.middleware.js';
import logger from '#utils/logger.js';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/all-admins', authController.getAllAdmins);
router.delete('/delete-admin/:id', authController.deleteAdmin);

// Protected routes
// router.use(protect);
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);
router.put('/update-details', protect, authController.updateDetails);
router.post('/logout', protect, authController.logout);

router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = req.file.filename;
  res.status(200).json({ imageUrl });
});

router.post(
  '/create-admin',
  upload.single('avatar'),
  validatePassKey('739639336427396'),
  authController.createAdmin
);

export default router;
