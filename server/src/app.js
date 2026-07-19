import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';

import { appConfig } from './config/app.config.js';
import { corsOptions } from './config/cors.config.js';
import { helmetOptions } from './config/helmet.config.js';
import { createSessionOptions } from './config/session.config.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import adminLawyerProfileRoutes from './routes/admin-lawyer-profile.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import lawyerProfileRoutes from './routes/lawyer-profile.routes.js';

const app = express();

app.disable('x-powered-by');

if (appConfig.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

/*
 * Limit request body size early to reduce accidental memory pressure and make
 * future abuse controls easier to reason about.
 */
app.use(express.json({ limit: appConfig.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: appConfig.jsonBodyLimit }));
app.use(session(createSessionOptions()));

app.use('/api/auth', authRoutes);
app.use('/api/admin/lawyer-profiles', adminLawyerProfileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/lawyer-profiles', lawyerProfileRoutes);
app.use('/api', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
