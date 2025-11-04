import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      minLength: [10, 'Title must be at least 10 characters long'],
      maxLength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      minLength: [100, 'Content must be at least 100 characters long'],
    },
    excerpt: {
      type: String,
      required: [true, 'Blog excerpt is required'],
      maxLength: [200, 'Excerpt cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Blog category is required'],
      enum: [
        'parenting',
        'pregnancy',
        'baby-names',
        'child-development',
        'nutrition',
        'health',
        'education',
        'activities',
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featuredImage: {
      url: {
        type: String,
        required: [true, 'Featured image is required'],
      },
      alt: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    readTime: {
      type: Number,
      required: true,
    },
    metaTitle: {
      type: String,
      required: [true, 'Meta title is required'],
      maxLength: [60, 'Meta title cannot exceed 60 characters'],
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      maxLength: [160, 'Meta description cannot exceed 160 characters'],
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual fields
blogSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const stripHtml = html => {
  if (!html) return '';
  // If content is an object (editor delta), stringify it first
  const str = typeof html === 'string' ? html : JSON.stringify(html);
  // Remove tags and collapse whitespace
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Document middleware
blogSchema.pre('save', function (next) {
  // Generate slug
  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  next();
});

blogSchema.pre('validate', function (next) {
  try {
    // Ensure content is treated as string (handles editor objects)
    const contentStr = stripHtml(this.content);
    const words = contentStr ? contentStr.split(/\s+/).length : 0;
    const wordsPerMinute = 200;

    this.readTime =
      words > 0 ? Math.max(1, Math.ceil(words / wordsPerMinute)) : 0;
    next();
  } catch (err) {
    next(err);
  }
});

// Instance methods
blogSchema.methods.isPublished = function () {
  return this.status === 'published';
};

// Static methods
blogSchema.statics.findSimilar = function (blogId, limit = 3) {
  return this.find({
    _id: { $ne: blogId },
    status: 'published',
  })
    .where('tags')
    .in(this.tags)
    .limit(limit)
    .select('title slug excerpt featuredImage')
    .populate('author', 'name avatar');
};

// Indexes
blogSchema.index({ slug: 1 }, { unique: true, background: true });

blogSchema.index(
  {
    status: 1,
    createdAt: -1,
    category: 1,
  },
  { background: true }
);

blogSchema.index(
  {
    title: 'text',
    content: 'text',
    tags: 'text',
  },
  {
    background: true,
    weights: {
      title: 3,
      content: 2,
      tags: 1,
    },
  }
);

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
