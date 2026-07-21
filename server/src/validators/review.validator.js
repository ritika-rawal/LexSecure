import { body, param, query } from 'express-validator';

import {
  REVIEW_COMMENT_LIMITS,
  REVIEW_LIST_LIMITS,
  REVIEW_RATING_LIMITS,
} from '../constants/review.js';

const ALLOWED_REVIEW_BODY_FIELDS = new Set(['rating', 'comment']);
const ALLOWED_REVIEW_LIST_QUERY_FIELDS = new Set(['page', 'limit']);
const UNSAFE_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const containsOnlyKeys = (value, allowedKeys) =>
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).every((key) => allowedKeys.has(key));

export const appointmentReviewParamValidator = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Appointment ID must be a valid MongoDB identifier.'),
];

export const createReviewValidator = [
  ...appointmentReviewParamValidator,
  body().custom((requestBody) => {
    if (
      !containsOnlyKeys(requestBody, ALLOWED_REVIEW_BODY_FIELDS)
      || !Object.hasOwn(requestBody, 'rating')
    ) {
      throw new Error('Request must contain a rating and optional comment only.');
    }

    return true;
  }),
  body('rating')
    .isInt({
      min: REVIEW_RATING_LIMITS.MINIMUM,
      max: REVIEW_RATING_LIMITS.MAXIMUM,
    })
    .withMessage('Rating must be a whole number between 1 and 5.')
    .toInt(),
  body('comment')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Review comment must be text.')
    .bail()
    .trim()
    .isLength({
      min: REVIEW_COMMENT_LIMITS.MINIMUM,
      max: REVIEW_COMMENT_LIMITS.MAXIMUM,
    })
    .withMessage(
      `Review comment must be between ${REVIEW_COMMENT_LIMITS.MINIMUM} and `
      + `${REVIEW_COMMENT_LIMITS.MAXIMUM} characters.`,
    )
    .bail()
    .custom((comment) => {
      if (UNSAFE_CONTROL_CHARACTER_PATTERN.test(comment)) {
        throw new Error('Review contains unsupported control characters.');
      }

      return true;
    }),
];

export const listPublicReviewsValidator = [
  param('profileId')
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB identifier.'),
  query().custom((queryValues) => {
    if (!containsOnlyKeys(queryValues, ALLOWED_REVIEW_LIST_QUERY_FIELDS)) {
      throw new Error('Request contains unsupported review filters.');
    }

    return true;
  }),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100_000 })
    .withMessage('Page must be between 1 and 100000.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: REVIEW_LIST_LIMITS.MAXIMUM })
    .withMessage(`Limit must be between 1 and ${REVIEW_LIST_LIMITS.MAXIMUM}.`)
    .toInt(),
];
