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
  }
);

// Create slug before saving
blogSchema.pre('save', function (next) {
  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  next();
});

// Add indexes for better query performance
blogSchema.index({ slug: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: 'text', content: 'text' });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
