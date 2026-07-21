import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';

import { appConfig } from './config/app.config.js';
import { corsOptions } from './config/cors.config.js';
import { helmetOptions } from './config/helmet.config.js';
import { apiRateLimiter } from './config/rate-limit.config.js';
import { createSessionOptions } from './config/session.config.js';
import accountExportRoutes from './routes/account-export.routes.js';
import { auditContextMiddleware } from './middleware/audit-context.middleware.js';
import { csrfProtectionMiddleware } from './middleware/csrf.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware.js';
import adminAuditRoutes from './routes/admin-audit.routes.js';
import adminLawyerProfileRoutes from './routes/admin-lawyer-profile.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import healthRoutes from './routes/health.routes.js';
import lawyerProfileRoutes from './routes/lawyer-profile.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reviewRoutes from './routes/review.routes.js';

const app = express();

app.disable('x-powered-by');

if (appConfig.trustProxyHops > 0) {
  app.set('trust proxy', appConfig.trustProxyHops);
}

app.use(helmet(helmetOptions));
app.use(securityHeadersMiddleware);
app.use(cors(corsOptions));
app.use(auditContextMiddleware);
app.use('/api', apiRateLimiter);

/*
 * Limit request body size early to reduce accidental memory pressure and make
 * future abuse controls easier to reason about.
 */
app.use(express.json({ limit: appConfig.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: appConfig.jsonBodyLimit }));

/*
 * Initialize exactly one session boundary before CSRF and application routes.
 * Sessions use MongoDB rather than process memory, while HTTP-only cookies keep
 * the session identifier unavailable to browser JavaScript.
 */
app.use(session(createSessionOptions()));

// All state-changing routes require a token bound to the current server session.
app.use(csrfProtectionMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/account', accountExportRoutes);
app.use('/api', documentRoutes);
app.use('/api', messageRoutes);
app.use('/api', reviewRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/lawyer-profiles', adminLawyerProfileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/lawyer-profiles', lawyerProfileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
