import logger from '#utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory path - use absolute path
const uploadDir = path.join(process.cwd(), 'uploads');

// Create upload directory if it doesn't exist
const initializeUploadDir = async () => {
  try {
    await fs.access(uploadDir);
    logger.info('Upload directory exists:', { path: uploadDir });
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
    logger.info('Created upload directory:', { path: uploadDir });
  }
};

// Initialize directory
await initializeUploadDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    logger.info('Multer saving file to:', { path: uploadDir });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;

    logger.info('Multer generated filename:', { filename });
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  logger.info('Multer checking file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png and .pdf formats are allowed'), false);
  }
};

// Add file size limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const cleanupTemp = async file => {
  try {
    if (file?.path) {
      logger.info('cleanupTemp.start', { path: file.path });
      await fs.unlink(file.path);
      logger.info('cleanupTemp.success', { path: file.path });
    }
  } catch (error) {
    logger.error('cleanupTemp.error', {
      message: error.message,
      path: file?.path,
    });
  }
};
