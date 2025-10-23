import mongoose from 'mongoose';
import logger from '#utils/logger.js';
import { DATABASE_URL } from '#config/index.js';

export default {
  connect: async () => {
    try {
      await mongoose.connect(DATABASE_URL);
      return mongoose.connection;
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  },
};
