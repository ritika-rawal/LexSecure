import { appConfig } from './app.config.js';

export const corsOptions = {
  origin(origin, callback) {
    /*
     * Browsers send an Origin header for CORS requests. Requests without an
     * Origin, such as curl or same-origin server-to-server checks, are allowed.
     */
    if (!origin || appConfig.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS policy does not allow this origin.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 204,
};
