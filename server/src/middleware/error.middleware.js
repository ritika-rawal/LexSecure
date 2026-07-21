import { appConfig } from '../config/app.config.js';

export const errorMiddleware = (error, req, res, next) => {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;

  /*
   * Avoid returning stack traces or internal exception details in production.
   * Detailed errors are useful during coursework development, but confidential
   * implementation details should not leak to API consumers.
   */
  const response = {
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : error.message,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (error.publicCode) {
    response.code = error.publicCode;
  }

  if (appConfig.exposeErrorDetails) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
