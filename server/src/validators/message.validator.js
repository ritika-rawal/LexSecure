import { body, param, query } from 'express-validator';

import {
  MESSAGE_LENGTH_LIMITS,
  MESSAGE_LIST_LIMITS,
} from '../constants/message.js';

const ALLOWED_MESSAGE_BODY_FIELDS = new Set(['message']);
const ALLOWED_MESSAGE_LIST_QUERY_FIELDS = new Set(['page', 'limit']);
const UNSAFE_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const appointmentIdValidator = param('appointmentId')
  .isMongoId()
  .withMessage('Appointment ID must be a valid MongoDB identifier.');

export const sendMessageValidator = [
  appointmentIdValidator,
  body().custom((requestBody) => {
    if (
      !requestBody
      || typeof requestBody !== 'object'
      || Array.isArray(requestBody)
      || !Object.keys(requestBody).every((key) =>
        ALLOWED_MESSAGE_BODY_FIELDS.has(key))
    ) {
      throw new Error('Request contains unsupported message fields.');
    }

    return true;
  }),
  body('message')
    .isString()
    .withMessage('Message must be text.')
    .bail()
    .trim()
    .isLength({
      min: MESSAGE_LENGTH_LIMITS.MINIMUM,
      max: MESSAGE_LENGTH_LIMITS.MAXIMUM,
    })
    .withMessage(
      `Message must be between ${MESSAGE_LENGTH_LIMITS.MINIMUM} and `
      + `${MESSAGE_LENGTH_LIMITS.MAXIMUM} characters.`,
    )
    .bail()
    .custom((message) => {
      if (UNSAFE_CONTROL_CHARACTER_PATTERN.test(message)) {
        throw new Error('Message contains unsupported control characters.');
      }

      return true;
    }),
];

export const listMessagesValidator = [
  appointmentIdValidator,
  query().custom((queryParameters) => {
    if (
      !Object.keys(queryParameters).every((key) =>
        ALLOWED_MESSAGE_LIST_QUERY_FIELDS.has(key))
    ) {
      throw new Error('Request contains unsupported query parameters.');
    }

    return true;
  }),
  query('page')
    .optional()
    .isInt({ min: 1, max: 10_000 })
    .withMessage('Page must be between 1 and 10000.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MESSAGE_LIST_LIMITS.MAXIMUM })
    .withMessage(
      `Limit must be between 1 and ${MESSAGE_LIST_LIMITS.MAXIMUM}.`,
    )
    .toInt(),
];
