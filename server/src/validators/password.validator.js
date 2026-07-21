import { body } from 'express-validator';

export const PASSWORD_MINIMUM_LENGTH = 12;
export const PASSWORD_MAXIMUM_LENGTH = 128;

export const strongPasswordValidator = (fieldName = 'password') =>
  body(fieldName)
    .isString()
    .withMessage('Password must be text.')
    .bail()
    .isLength({ min: PASSWORD_MINIMUM_LENGTH, max: PASSWORD_MAXIMUM_LENGTH })
    .withMessage(
      `Password must be between ${PASSWORD_MINIMUM_LENGTH} and ${PASSWORD_MAXIMUM_LENGTH} characters.`,
    )
    .matches(/[a-z]/)
    .withMessage('Password must include at least one lowercase letter.')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include at least one symbol.');
