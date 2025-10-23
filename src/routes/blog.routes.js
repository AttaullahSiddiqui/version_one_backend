import { Router } from 'express';
import blogController from '#controllers/blog.controller.js';

const router = Router();

// Get all blogs with pagination
router.get('/all', blogController.getAllBlogs);

// Get single blog by slug
router.get('/:slug', blogController.getBlogBySlug);

// Get blogs by category
router.get('/category/:category', blogController.getBlogsByCategory);

// Search blogs
router.get('/search/:query', blogController.searchBlogs);

// Create new blog (protected route)
router.post('/create', blogController.createBlog);

// Update blog (protected route)
router.put('/update/:id', blogController.updateBlog);

// Delete blog (protected route)
router.delete('/delete/:id', blogController.deleteBlog);

export default router;
