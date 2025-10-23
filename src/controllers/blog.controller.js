import Blog from '../models/blog.model.js';
import httpError from '#utils/httpError.js';
import httpResponse from '#utils/httpResponse.js';

export default {
  getAllBlogs: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const blogs = await Blog.find()
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Blog.countDocuments();

      httpResponse(req, res, 200, 'Blogs retrieved successfully', {
        blogs,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch (error) {
      httpError(next, error.message, req, 500);
    }
  },

  getBlogBySlug: async (req, res, next) => {
    try {
      const blog = await Blog.findOne({
        slug: req.params.slug,
        status: 'published',
      }).populate('author', 'name avatar');

      if (!blog) {
        httpError(next, 'Blog not found', req, 404);
        return;
      }

      await Blog.findByIdAndUpdate(blog._id, {
        $inc: { views: 1 },
      });

      httpResponse(req, res, 200, 'Blog retrieved successfully', blog);
    } catch (error) {
      httpError(next, error.message, req, 500);
    }
  },

  getBlogsByCategory: async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query = {
        category: req.params.category,
        status: 'published',
      };

      const blogs = await Blog.find(query)
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Blog.countDocuments(query);

      httpResponse(req, res, 200, 'Blogs retrieved successfully', {
        blogs,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total,
      });
    } catch (error) {
      httpError(next, error.message, req, 500);
    }
  },

  searchBlogs: async (req, res, next) => {
    try {
      const { query } = req.params;

      const blogs = await Blog.find({
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
      })
        .populate('author', 'name avatar')
        .select('-content');

      httpResponse(
        req,
        res,
        200,
        'Search results retrieved successfully',
        blogs
      );
    } catch (error) {
      httpError(next, error.message, req, 500);
    }
  },

  createBlog: async (req, res, next) => {
    try {
      const blog = new Blog({
        ...req.body,
        author: req.user._id,
      });

      const savedBlog = await blog.save();
      await savedBlog.populate('author', 'name avatar');

      httpResponse(req, res, 201, 'Blog created successfully', savedBlog);
    } catch (error) {
      httpError(next, error.message, req, 400);
    }
  },

  updateBlog: async (req, res, next) => {
    try {
      const blog = await Blog.findOneAndUpdate(
        {
          _id: req.params.id,
          author: req.user._id,
        },
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate('author', 'name avatar');

      if (!blog) {
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blog updated successfully', blog);
    } catch (error) {
      httpError(next, error.message, req, 400);
    }
  },

  deleteBlog: async (req, res, next) => {
    try {
      const blog = await Blog.findOneAndDelete({
        _id: req.params.id,
        author: req.user._id,
      });

      if (!blog) {
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blog deleted successfully');
    } catch (error) {
      httpError(next, error.message, req, 500);
    }
  },
};
