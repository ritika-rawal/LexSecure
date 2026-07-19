import { param, query } from 'express-validator';

const ALLOWED_LIST_QUERY_FIELDS = new Set(['page', 'limit', 'specialization']);

export const listPublicLawyerProfilesValidator = [
  query().custom((queryParameters) => {
    const containsOnlyAllowedFields = Object.keys(queryParameters).every((key) =>
      ALLOWED_LIST_QUERY_FIELDS.has(key),
    );

    if (!containsOnlyAllowedFields) {
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
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.')
    .toInt(),
  query('specialization')
    .optional()
    .isString()
    .withMessage('Specialization must be text.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Specialization must be between 2 and 80 characters.'),
];

export const getPublicLawyerProfileValidator = [
  param('profileId')
    .isMongoId()
    .withMessage('Profile ID must be a valid MongoDB identifier.'),
];
