import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default {
  async upload(file, options = {}) {
    if (!file) throw new Error('No file provided to upload');

    let fileSource;
    if (typeof file === 'string') {
      fileSource = file;
    } else if (file.path) {
      fileSource = file.path;
    } else if (file.buffer) {
      const mime = file.mimetype || 'application/octet-stream';
      const base64 = file.buffer.toString('base64');
      fileSource = `data:${mime};base64,${base64}`;
    } else {
      throw new Error('Unsupported file object provided to Cloudinary upload');
    }

    const {
      folder,
      width,
      height,
      crop,
      quality,
      fetch_format,
      transformation,
      ...rest
    } = options;

    const uploadOptions = { ...rest };
    if (folder) uploadOptions.folder = folder;
    if (fetch_format) uploadOptions.fetch_format = fetch_format;

    if (transformation) {
      uploadOptions.transformation = transformation;
    } else {
      const transform = {};
      if (width) transform.width = width;
      if (height) transform.height = height;
      if (crop) transform.crop = crop;
      if (quality) transform.quality = quality;
      if (Object.keys(transform).length) {
        uploadOptions.transformation = transform;
      }
    }

    try {
      const result = await cloudinary.uploader.upload(
        fileSource,
        uploadOptions
      );
      return result;
    } catch (err) {
      throw err;
    }
  },
  async delete(public_id) {
    if (!public_id) throw new Error('publicId is required to destroy an asset');
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return result;
    } catch (err) {
      throw err;
    }
  },
  async update(file, oldPublicId, folder = 'avatars') {
    try {
      const [uploadResult] = await Promise.all([
        this.upload(file, folder),
        this.delete(oldPublicId),
      ]);
      return uploadResult;
    } catch (error) {
      logger.error('Cloudinary update error:', error);
      throw new Error('Image update failed');
    }
  },
};
