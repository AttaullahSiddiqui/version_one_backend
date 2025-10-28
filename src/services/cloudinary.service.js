import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default {
  async upload(file, folder = 'website/avatars') {
    try {
      if (!file) throw new Error('No file provided');

      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' },
        ],
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Image upload failed');
    }
  },
  async delete(public_id) {
    try {
      if (!public_id) return;
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error('Image deletion failed');
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
