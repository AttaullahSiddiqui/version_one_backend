import { Router } from 'express';
import { upload } from '#middleware/multer.middleware.js';
import blogController from '#controllers/blog.controller.js';
import { protect, validatePassKey } from '#middleware/auth.middleware.js';

const router = Router();

router.get('/', blogController.getAllBlogs);
router.get('/count', blogController.getBlogCounts);
router.get('/:slug', blogController.getBlogBySlug);
router.get('/category/:category', blogController.getBlogsByCategory);
router.get('/search/:query', blogController.searchBlogs);

router.use(protect);
// router.use(validatePassKey('739639336427396'));
router.post(
  '/create',
  upload.single('featuredImage'),
  blogController.createBlog
);
router.put(
  '/update/:id',
  upload.single('featuredImage'),
  blogController.updateBlog
);
router.delete('/delete/:id', blogController.deleteBlog);

export default router;
