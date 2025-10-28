import { Router } from 'express';
import blogController from '#controllers/blog.controller.js';
import { protect, validatePassKey } from '#middleware/auth.middleware.js';

const router = Router();

router.get('/all', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);
router.get('/category/:category', blogController.getBlogsByCategory);
router.get('/search/:query', blogController.searchBlogs);

router.use(protect);
router.use(validatePassKey('739639336427396'));
router.post('/create', blogController.createBlog);
router.put('/update/:id', blogController.updateBlog);
router.delete('/delete/:id', blogController.deleteBlog);

export default router;
