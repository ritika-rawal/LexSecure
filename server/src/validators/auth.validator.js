import { body } from 'express-validator';

import { SELF_REGISTRATION_ROLE_VALUES } from '../constants/user-roles.js';
import { CAPTCHA_LIMITS } from '../constants/authentication-security.js';
import { EMAIL_VERIFICATION_TOKEN_PATTERN } from '../constants/email-verification.js';
import {
  PASSWORD_MAXIMUM_LENGTH,
  strongPasswordValidator,
} from './password.validator.js';

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
  strongPasswordValidator(),
  body('role')
    .isString()
    .withMessage('Role must be text.')
    .trim()
    .toLowerCase()
    .isIn(SELF_REGISTRATION_ROLE_VALUES)
    .withMessage('Role must be either client or lawyer.'),
];

export const loginValidator = [
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
    .isLength({ min: 1, max: PASSWORD_MAXIMUM_LENGTH })
    .withMessage(`Password must not exceed ${PASSWORD_MAXIMUM_LENGTH} characters.`),
  body('captchaToken')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Security verification token must be text.')
    .isLength({ min: 1, max: CAPTCHA_LIMITS.TOKEN_MAXIMUM_LENGTH })
    .withMessage('Security verification token is invalid.'),
];

export const verifyEmailValidator = [
  body('token')
    .isString()
    .withMessage('Verification token must be text.')
    .matches(EMAIL_VERIFICATION_TOKEN_PATTERN)
    .withMessage('Verification link is invalid or has expired.'),
];
