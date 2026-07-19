import { body, param, query } from 'express-validator';

import {
  LAWYER_APPROVAL_STATUS,
  LAWYER_APPROVAL_STATUS_VALUES,
} from '../constants/lawyer-profile.js';

const ALLOWED_LIST_QUERY_FIELDS = new Set(['status', 'page', 'limit']);
const ALLOWED_REVIEW_FIELDS = new Set(['decision']);

const containsOnlyKeys = (value, allowedKeys) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).every((key) => allowedKeys.has(key));

export const listLawyerProfilesValidator = [
  query().custom((queryValues) => {
    if (!containsOnlyKeys(queryValues, ALLOWED_LIST_QUERY_FIELDS)) {
      throw new Error('Request contains unsupported query parameters.');
    }
    return true;
  }),
  query('status')
    .optional()
    .isIn(LAWYER_APPROVAL_STATUS_VALUES)
    .withMessage('Status must be pending, approved, or rejected.'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100_000 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.')
    .toInt(),
];

export const reviewLawyerProfileValidator = [
  param('profileId')
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB identifier.'),
  body().custom((requestBody) => {
    if (
      !containsOnlyKeys(requestBody, ALLOWED_REVIEW_FIELDS) ||
      Object.keys(requestBody).length !== 1
    ) {
      throw new Error('Request must contain only the review decision.');
    }
    return true;
  }),
  body('decision')
    .isIn([
      LAWYER_APPROVAL_STATUS.APPROVED,
      LAWYER_APPROVAL_STATUS.REJECTED,
    ])
    .withMessage('Decision must be approved or rejected.'),
];
