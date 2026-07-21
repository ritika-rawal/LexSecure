import { body } from 'express-validator';

import { PASSWORD_RESET_TOKEN_PATTERN } from '../constants/password-reset.js';
import { strongPasswordValidator } from './password.validator.js';

const containsExactly = (value, requiredKeys) =>
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).length === requiredKeys.size
  && Object.keys(value).every((key) => requiredKeys.has(key));

export const passwordResetRequestValidator = [
  body().custom((requestBody) => {
    if (!containsExactly(requestBody, new Set(['email']))) {
      throw new Error('Request must contain an email address only.');
    }

    return true;
  }),
  body('email')
    .isString()
    .withMessage('Email must be text.')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address.')
    .bail()
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters.')
    .customSanitizer((email) => email.toLowerCase()),
];

export const passwordResetConfirmValidator = [
  body().custom((requestBody) => {
    if (!containsExactly(requestBody, new Set(['token', 'password']))) {
      throw new Error('Request must contain a reset token and new password only.');
    }

    return true;
  }),
  body('token')
    .isString()
    .withMessage('Reset token must be text.')
    .bail()
    .matches(PASSWORD_RESET_TOKEN_PATTERN)
    .withMessage('Password reset link is invalid or has expired.'),
  strongPasswordValidator(),
];
