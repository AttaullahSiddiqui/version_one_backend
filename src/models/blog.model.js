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
    metaDescription: {
      type: String,
      required: true,
      maxLength: [160, 'Meta description cannot exceed 160 characters'],
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

// Document middleware
blogSchema.pre('save', function (next) {
  // Generate slug
  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  // Calculate read time
  const wordsPerMinute = 200;
  const wordCount = this.content.trim().split(/\s+/).length;
  this.readTime = Math.ceil(wordCount / wordsPerMinute);

  next();
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
