import Blog from '../models/blog.model.js';
import httpError from '#utils/httpError.js';
import httpResponse from '#utils/httpResponse.js';

export default {
  getAllBlogs: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status = 'published' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query = { status };
      const blogs = await Blog.find(query)
        .populate('author', 'name avatar')
        .select('-content') // Don't send full content in listing
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Blog.countDocuments(query);

      if (!blogs || blogs.length === 0) {
        httpError(next, 'No blogs found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blogs retrieved successfully', {
        blogs,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + blogs.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getBlogBySlug: async (req, res, next) => {
    try {
      if (!req.params.slug) {
        httpError(next, 'Blog slug is required', req, 400);
        return;
      }

      const blog = await Blog.findOne({
        slug: req.params.slug,
        status: 'published',
      }).populate('author', 'name avatar');

      if (!blog) {
        httpError(next, 'Blog not found', req, 404);
        return;
      }

      // Update views in background
      Blog.findByIdAndUpdate(blog._id, {
        $inc: { views: 1 },
      }).exec();

      httpResponse(req, res, 200, 'Blog retrieved successfully', blog);
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getBlogsByCategory: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status = 'published' } = req.query;
      const { category } = req.params;

      if (!category) {
        httpError(next, 'Category is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { category, status };

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .populate('author', 'name avatar')
          .select('-content')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Blog.countDocuments(query),
      ]);

      if (!blogs || blogs.length === 0) {
        httpError(next, 'No blogs found in this category', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blogs retrieved successfully', {
        blogs,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + blogs.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  searchBlogs: async (req, res, next) => {
    try {
      const { query } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!query || query.length < 2) {
        httpError(next, 'Search query must be at least 2 characters', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const searchQuery = {
        $and: [
          { status: 'published' },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { content: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } },
            ],
          },
        ],
      };

      const [blogs, total] = await Promise.all([
        Blog.find(searchQuery)
          .populate('author', 'name avatar')
          .select('title excerpt slug category tags author createdAt updatedAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Blog.countDocuments(searchQuery),
      ]);

      httpResponse(req, res, 200, 'Search results retrieved successfully', {
        blogs,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + blogs.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  createBlog: async (req, res, next) => {
    try {
      const { title, content, category, tags } = req.body;

      if (!title || !content || !category) {
        httpError(next, 'Please provide all required fields', req, 400);
        return;
      }

      const blog = new Blog({
        ...req.body,
        author: req.user._id,
        status: req.body.status || 'draft',
      });

      const savedBlog = await blog.save();
      await savedBlog.populate('author', 'name avatar');

      httpResponse(req, res, 201, 'Blog created successfully', savedBlog);
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  updateBlog: async (req, res, next) => {
    try {
      if (!req.params.id) {
        httpError(next, 'Blog ID is required', req, 400);
        return;
      }

      const blog = await Blog.findOneAndUpdate(
        {
          _id: req.params.id,
          author: req.user._id,
        },
        {
          $set: req.body,
          updatedAt: Date.now(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('author', 'name avatar');

      if (!blog) {
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blog updated successfully', blog);
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  deleteBlog: async (req, res, next) => {
    try {
      if (!req.params.id) {
        httpError(next, 'Blog ID is required', req, 400);
        return;
      }

      const blog = await Blog.findOne({
        _id: req.params.id,
        author: req.user._id,
      });

      if (!blog) {
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      await blog.deleteOne();
      httpResponse(req, res, 200, 'Blog deleted successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
};
