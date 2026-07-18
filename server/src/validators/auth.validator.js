import { body } from 'express-validator';

import { SELF_REGISTRATION_ROLE_VALUES } from '../constants/user-roles.js';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export const registerValidator = [
  body('fullName')
    .isString()
    .withMessage('Full name must be text.')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('email')
    .isString()
    .withMessage('Email must be text.')
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address.')
    .customSanitizer((email) => email.toLowerCase())
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters.'),
  body('password')
    .isString()
    .withMessage('Password must be text.')
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`)
    .matches(/[a-z]/)
    .withMessage('Password must include at least one lowercase letter.')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include at least one symbol.'),
  body('role')
    .isString()
    .withMessage('Role must be text.')
    .trim()
    .toLowerCase()
    .isIn(SELF_REGISTRATION_ROLE_VALUES)
    .withMessage('Role must be either client or lawyer.'),
];
