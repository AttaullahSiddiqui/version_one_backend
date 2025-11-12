import Blog from '../models/blog.model.js';
import httpError from '#utils/httpError.js';
import httpResponse from '#utils/httpResponse.js';
import cloudinary from '#services/cloudinary.service.js';
import { cleanupTemp } from '#middleware/multer.middleware.js';

export default {
  getAllBlogs: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status = 'published' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query = status !== 'all' ? { status } : {};
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

  // Public: fetch top blogs (by views -> likes -> recency)
  getTopBlogs: async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;
      const max = Math.min(Math.max(Number(limit) || 5, 1), 50);

      const blogs = await Blog.find({ status: 'published' })
        .populate('author', 'name avatar')
        .select(
          'title excerpt slug featuredImage author readTime createdAt views likes'
        )
        .sort({ views: -1, likes: -1, createdAt: -1 })
        .limit(max)
        .lean();

      if (!blogs || blogs.length === 0) {
        httpError(next, 'No top blogs found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Top blogs retrieved successfully', {
        blogs,
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getBlogBySlug: async (req, res, next) => {
    console.log('Get blog by Slug working');
    console.log(req.params.slug);
    try {
      const { slug } = req.params;
      if (!slug) {
        httpError(next, 'Blog Slug is required', req, 400);
        return;
      }

      const blog = await Blog.findOne({ slug })
        .populate('author', 'name avatar')
        .exec();

      if (!blog) {
        httpError(next, 'Blog not found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Blog retrieved successfully', blog);
    } catch (error) {
      // handle cast error (invalid ObjectId) as not found
      if (error.name === 'CastError') {
        httpError(next, 'Blog not found', req, 404);
        return;
      }
      httpError(next, error, req, 500);
    }
  },

  getBlogsByCategory: async (req, res, next) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10, status = 'published' } = req.query;

      if (!category) {
        httpError(next, 'Category is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      // determine status filter: authenticated users can request 'all', otherwise default to published
      let statusFilter = status;
      if (!req.user && status !== 'published') {
        statusFilter = 'published';
      }

      const query =
        statusFilter === 'all'
          ? { category }
          : { category, status: statusFilter };

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .populate('author', 'name avatar')
          .select('-content')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .exec(),
        Blog.countDocuments(query),
      ]);

      if (!blogs || blogs.length === 0) {
        httpError(next, 'No blogs found for this category', req, 404);
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
      // support both route param and query param for query string
      const q = req.params.query || req.query.q;
      const { page = 1, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        httpError(next, 'Search query must be at least 2 characters', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      // base status filter: unauthenticated users only see published posts
      const statusClause = req.user ? {} : { status: 'published' };

      const searchQuery = {
        ...statusClause,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
          { excerpt: { $regex: q, $options: 'i' } },
        ],
      };

      const [blogs, total] = await Promise.all([
        Blog.find(searchQuery)
          .populate('author', 'name avatar')
          .select('title excerpt slug category tags author createdAt updatedAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .exec(),
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
    console.log(req.body.tags);
    console.log(Array.isArray(req.body.tags));
    console.log(JSON.parse(req.body.tags));
    console.log(typeof req.body.tags);
    console.log(typeof JSON.parse(req.body.tags));

    try {
      const {
        title,
        excerpt,
        content,
        category,
        tags,
        metaTitle,
        metaDescription,
        authorId,
        status = 'draft',
      } = req.body;

      // validate required fields including metaTitle
      if (
        !title ||
        !excerpt ||
        !content ||
        !category ||
        !metaTitle ||
        !metaDescription ||
        !authorId
      ) {
        if (req.file) await cleanupTemp(req.file);
        httpError(next, 'Please provide all required fields', req, 400);
        return;
      }

      let featuredImage = {
        url: 'https://your-default-blog-image.com/default.jpg',
        alt: 'Default blog image',
      };

      if (req.file) {
        try {
          const result = await cloudinary.upload(req.file, {
            folder: 'blogs/featured',
            width: 1200,
            height: 630,
            crop: 'fill',
            quality: 'auto',
            // Add these options for better optimization
            fetch_format: 'auto',
            loading: 'lazy',
            responsive: true,
          });

          featuredImage = {
            url: result.secure_url,
            alt: req.body.featuredImageAlt || title,
          };

          await cleanupTemp(req.file);
        } catch (error) {
          await cleanupTemp(req.file);
          console.error('Cloudinary upload error:', error);
          httpError(next, 'Error uploading featured image', req, 500);
          return;
        }
      }

      const blog = await Blog.create({
        title,
        excerpt,
        content,
        category,
        tags: Array.isArray(JSON.parse(tags)) ? JSON.parse(tags) : [],
        author: authorId,
        featuredImage,
        status,
        metaTitle,
        metaDescription,
      });

      httpResponse(req, res, 201, 'Blog created successfully', {
        blog,
      });
    } catch (error) {
      if (req.file) await cleanupTemp(req.file);
      httpError(next, error, req, 500);
    }
  },

  updateBlog: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const {
        title,
        excerpt,
        content,
        category,
        tags,
        metaTitle,
        metaDescription,
        status,
        featuredImageAlt,
      } = req.body;

      if (!slug) {
        if (req.file) await cleanupTemp(req.file);
        httpError(next, 'Blog Slug is required', req, 400);
        return;
      }

      const existingBlog = await Blog.findOne({ slug });
      if (!existingBlog) {
        if (req.file) await cleanupTemp(req.file);
        httpError(next, 'Blog not found', req, 404);
        return;
      }

      let parsedTags = existingBlog.tags;
      if (tags) {
        try {
          parsedTags = Array.isArray(tags)
            ? tags
            : typeof tags === 'string'
              ? JSON.parse(tags)
              : [];

          if (!Array.isArray(parsedTags)) {
            throw new Error('Tags must be an array');
          }
        } catch (error) {
          if (req.file) await cleanupTemp(req.file);
          httpError(next, 'Invalid tags format', req, 400);
          return;
        }
      }

      const updateData = {
        ...(title !== undefined && { title }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags && { tags: parsedTags }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(status !== undefined && { status }),
        updatedAt: Date.now(),
      };

      if (req.file) {
        try {
          const result = await cloudinary.upload(req.file, {
            folder: 'blogs/featured',
            width: 1200,
            height: 630,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
            loading: 'lazy',
            responsive: true,
          });

          const oldPublicId = existingBlog.featuredImage?.url
            ? existingBlog.featuredImage.url.split('/').pop().split('.')[0]
            : null;

          if (oldPublicId) {
            try {
              await cloudinary.delete(oldPublicId);
            } catch (err) {
              console.warn('Failed to delete old image from Cloudinary', err);
            }
          }

          updateData.featuredImage = {
            url: result.secure_url,
            alt: featuredImageAlt || existingBlog.featuredImage?.alt,
          };

          await cleanupTemp(req.file);
        } catch (error) {
          await cleanupTemp(req.file);
          httpError(next, 'Error uploading featured image', req, 500);
          return;
        }
      } else if (featuredImageAlt) {
        updateData.featuredImage = {
          url: existingBlog.featuredImage?.url,
          alt: featuredImageAlt,
        };
      }

      try {
        Object.assign(existingBlog, updateData);

        await existingBlog.save();

        const updatedBlog = await Blog.findById(existingBlog._id).populate(
          'author',
          'name avatar'
        );

        if (!updatedBlog) {
          httpError(next, 'Failed to update blog', req, 400);
          return;
        }

        httpResponse(req, res, 200, 'Blog updated successfully', {
          blog: updatedBlog,
        });
      } catch (error) {
        console.log(error);
        throw error;
      }
    } catch (error) {
      if (req.file) await cleanupTemp(req.file);
      httpError(next, error, req, 500);
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
      });

      if (!blog) {
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      if (blog.featuredImage?.url) {
        try {
          const publicId = blog.featuredImage.url
            .split('/')
            .pop()
            .split('.')[0];
          await cloudinary.delete(publicId);
        } catch (err) {
          console.warn('Failed to delete image from Cloudinary:', err);
        }
      }

      await blog.deleteOne();
      httpResponse(req, res, 200, 'Blog deleted successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
  getBlogCounts: async (req, res, next) => {
    try {
      const [totalBlogs, publishedBlogs, draftBlogs] = await Promise.all([
        Blog.countDocuments({}),
        Blog.countDocuments({ status: 'published' }),
        Blog.countDocuments({ status: 'draft' }),
      ]);

      httpResponse(req, res, 200, 'Blog counts retrieved successfully', {
        total: totalBlogs,
        published: publishedBlogs,
        drafts: draftBlogs,
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
};
