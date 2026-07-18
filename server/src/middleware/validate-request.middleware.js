import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const validation = validationResult(req);

  if (validation.isEmpty()) {
    next();
    return;
  }

  const error = new Error('Request validation failed.');
  error.statusCode = 400;
  error.details = validation.array().map((validationError) => ({
    field: validationError.path,
    message: validationError.msg,
  }));

  next(error);
};
