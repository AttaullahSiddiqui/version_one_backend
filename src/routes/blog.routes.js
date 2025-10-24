import { Router } from 'express';
import blogController from '#controllers/blog.controller.js';
import { protect, restrictTo } from '#middleware/auth.middleware.js';

const router = Router();

router.get('/all', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);
router.get('/category/:category', blogController.getBlogsByCategory);
router.get('/search/:query', blogController.searchBlogs);

router.use(protect);
router.use(restrictTo('admin'));
router.post('/create', blogController.createBlog);
router.put('/update/:id', blogController.updateBlog);
router.delete('/delete/:id', blogController.deleteBlog);

export default router;
