import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { appConfig } from './config/app.config.js';
import { corsOptions } from './config/cors.config.js';
import { helmetOptions } from './config/helmet.config.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

app.disable('x-powered-by');

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

/*
 * Limit request body size early to reduce accidental memory pressure and make
 * future abuse controls easier to reason about.
 */
app.use(express.json({ limit: appConfig.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: appConfig.jsonBodyLimit }));

app.use('/api', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
