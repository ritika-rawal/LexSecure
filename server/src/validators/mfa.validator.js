import { body } from 'express-validator';

import {
  MFA_RECOVERY_CODE_PATTERN,
  MFA_TOTP_PATTERN,
} from '../constants/mfa.js';

const PASSWORD_MAXIMUM_LENGTH = 128;
const containsOnlyKeys = (value, allowedKeys) =>
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).every((key) => allowedKeys.has(key));

const codeValidator = (fieldName = 'code') =>
  body(fieldName)
    .isString()
    .withMessage('Authentication code must be text.')
    .bail()
    .trim()
    .custom((value) =>
      MFA_TOTP_PATTERN.test(value)
      || MFA_RECOVERY_CODE_PATTERN.test(value.toUpperCase()))
    .withMessage('Enter a valid authenticator or recovery code.');

export const emptyMfaSetupValidator = [
  body().custom((requestBody) => {
    if (
      requestBody
      && (
        typeof requestBody !== 'object'
        || Array.isArray(requestBody)
        || Object.keys(requestBody).length > 0
      )
    ) {
      throw new Error('MFA setup does not accept request fields.');
    }

    return true;
  }),
];

export const mfaCodeValidator = [
  body().custom((requestBody) => {
    if (
      !containsOnlyKeys(requestBody, new Set(['code']))
      || !Object.hasOwn(requestBody, 'code')
    ) {
      throw new Error('Request must contain an authentication code only.');
    }

    return true;
  }),
  codeValidator(),
];

export const mfaTotpValidator = [
  body().custom((requestBody) => {
    if (
      !containsOnlyKeys(requestBody, new Set(['code']))
      || !Object.hasOwn(requestBody, 'code')
    ) {
      throw new Error('Request must contain an authenticator code only.');
    }

    return true;
  }),
  body('code')
    .isString()
    .withMessage('Authenticator code must be text.')
    .bail()
    .trim()
    .matches(MFA_TOTP_PATTERN)
    .withMessage('Enter the six-digit code from your authenticator app.'),
];

export const disableMfaValidator = [
  body().custom((requestBody) => {
    if (
      !containsOnlyKeys(requestBody, new Set(['password', 'code']))
      || !Object.hasOwn(requestBody, 'password')
      || !Object.hasOwn(requestBody, 'code')
    ) {
      throw new Error('Request must contain password and authentication code.');
    }

    return true;
  }),
  body('password')
    .isString()
    .withMessage('Password must be text.')
    .bail()
    .isLength({ min: 1, max: PASSWORD_MAXIMUM_LENGTH })
    .withMessage(`Password must not exceed ${PASSWORD_MAXIMUM_LENGTH} characters.`),
  codeValidator(),
];
