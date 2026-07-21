import { body } from 'express-validator';

import { strongPasswordValidator } from './password.validator.js';

export const passwordChangeValidator = [
  body().custom((requestBody) => {
    const keys = requestBody && typeof requestBody === 'object'
      ? Object.keys(requestBody)
      : [];

    if (
      keys.length !== 2
      || !keys.includes('currentPassword')
      || !keys.includes('newPassword')
    ) {
      throw new Error('Request must contain currentPassword and newPassword only.');
    }

    return true;
  }),
  body('currentPassword')
    .isString()
    .withMessage('Current password must be text.')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Current password is required and must not exceed 128 characters.'),
  strongPasswordValidator('newPassword'),
];
