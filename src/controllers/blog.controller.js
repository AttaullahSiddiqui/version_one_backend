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
      const { id } = req.params;
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

      if (!id) {
        if (req.file) await cleanupTemp(req.file);
        httpError(next, 'Blog ID is required', req, 400);
        return;
      }

      const existingBlog = await Blog.findOne({
        _id: id,
        author: req.user._id,
      });

      if (!existingBlog) {
        if (req.file) await cleanupTemp(req.file);
        httpError(next, 'Blog not found or unauthorized', req, 404);
        return;
      }

      const updateData = {
        // only set fields that are provided; keep others unchanged
        ...(title !== undefined && { title }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        tags: Array.isArray(tags) ? tags : existingBlog.tags,
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

          // Prefer stored public_id if available, fallback to URL parsing
          const oldPublicId =
            existingBlog.featuredImage?.public_id ||
            (existingBlog.featuredImage?.url
              ? existingBlog.featuredImage.url.split('/').pop().split('.')[0]
              : null);

          if (oldPublicId) {
            try {
              await cloudinary.delete(oldPublicId);
            } catch (err) {
              // log but don't fail the whole request for a delete error
              console.warn('Failed to delete old image from Cloudinary', err);
            }
          }

          // Update featured image data
          updateData.featuredImage = {
            url: result.secure_url,
            alt: featuredImageAlt || title || existingBlog.featuredImage?.alt,
            public_id: result.public_id || null,
          };

          await cleanupTemp(req.file);
        } catch (error) {
          await cleanupTemp(req.file);
          httpError(next, 'Error uploading featured image', req, 500);
          return;
        }
      } else if (featuredImageAlt && existingBlog.featuredImage) {
        // Update only alt text if provided without new image
        updateData.featuredImage = {
          ...existingBlog.featuredImage,
          alt: featuredImageAlt,
        };
      }

      // Update blog with new data
      const updatedBlog = await Blog.findOneAndUpdate(
        {
          _id: id,
          author: req.user._id,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('author', 'name avatar');

      if (!updatedBlog) {
        httpError(next, 'Failed to update blog', req, 400);
        return;
      }

      httpResponse(req, res, 200, 'Blog updated successfully', {
        blog: updatedBlog,
      });
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
