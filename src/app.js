import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // coz path is unavailable in type=module
import cookieParser from 'cookie-parser';
import compression from 'compression';

import systemRoutes from '#routes/system.routes.js';
import authRoutes from '#routes/auth.routes.js';
import blogRoutes from '#routes/blog.routes.js';
import nameRoutes from '#routes/name.routes.js';
import { corsHandler } from '#utils/corsHandler.js';
import globalErrorHandler from '#middleware/globalErrorHandler.js';
import { routeNotFound } from '#utils/routeNotFound.js';
import logger from '#utils/logger.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../', 'public')));
app.use(corsHandler);

app.get('/', (req, res) => {
  logger.info('Welcome to Version One Backend!');
  res.status(200).send('Welcome to Version One Backend!');
});

app.use('/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/names', nameRoutes);

app.use(routeNotFound);

app.use(globalErrorHandler);

export default app;
