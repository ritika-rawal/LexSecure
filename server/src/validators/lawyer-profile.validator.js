import { body } from 'express-validator';

import { WEEK_DAYS } from '../constants/lawyer-profile.js';
import {
  isValidWeeklyAvailability,
  TIME_24_HOUR_PATTERN,
} from '../utils/availability.js';

const ALLOWED_PROFILE_FIELDS = new Set([
  'professionalTitle',
  'biography',
  'specializations',
  'yearsOfExperience',
  'consultationFee',
  'timezone',
  'weeklyAvailability',
]);
const ALLOWED_FEE_FIELDS = new Set(['amount', 'currency']);
const ALLOWED_SLOT_FIELDS = new Set(['dayOfWeek', 'startTime', 'endTime']);
const TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/;

const containsOnlyKeys = (value, allowedKeys) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).every((key) => allowedKeys.has(key));

export const createLawyerProfileValidator = [
  body().custom((requestBody) => {
    if (!containsOnlyKeys(requestBody, ALLOWED_PROFILE_FIELDS)) {
      throw new Error('Request contains unsupported lawyer profile fields.');
    }

    if (
      requestBody.consultationFee &&
      !containsOnlyKeys(requestBody.consultationFee, ALLOWED_FEE_FIELDS)
    ) {
      throw new Error('Consultation fee contains unsupported fields.');
    }

    if (
      Array.isArray(requestBody.weeklyAvailability) &&
      requestBody.weeklyAvailability.some(
        (slot) => !containsOnlyKeys(slot, ALLOWED_SLOT_FIELDS),
      )
    ) {
      throw new Error('Availability contains unsupported fields.');
    }

    return true;
  }),
  body('professionalTitle')
    .isString()
    .withMessage('Professional title must be text.')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Professional title must be between 2 and 120 characters.'),
  body('biography')
    .isString()
    .withMessage('Biography must be text.')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Biography must be between 20 and 2000 characters.'),
  body('specializations')
    .isArray({ min: 1, max: 10 })
    .withMessage('Specializations must contain between 1 and 10 entries.')
    .custom((values) => {
      const normalizedValues = values.map((value) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
      );
      return new Set(normalizedValues).size === normalizedValues.length;
    })
    .withMessage('Specializations must be unique.'),
  body('specializations.*')
    .isString()
    .withMessage('Each specialization must be text.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Each specialization must be between 2 and 80 characters.'),
  body('yearsOfExperience')
    .custom(Number.isInteger)
    .withMessage('Years of experience must be a whole number.')
    .isInt({ min: 0, max: 70 })
    .withMessage('Years of experience must be between 0 and 70.'),
  body('consultationFee')
    .isObject({ strict: true })
    .withMessage('Consultation fee must be an object.'),
  body('consultationFee.amount')
    .custom((value) => Number.isFinite(value))
    .withMessage('Consultation fee amount must be a number.')
    .isFloat({ min: 0, max: 1_000_000 })
    .withMessage('Consultation fee amount must be between 0 and 1000000.'),
  body('consultationFee.currency')
    .isString()
    .withMessage('Consultation fee currency must be text.')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{3}$/)
    .withMessage('Consultation fee currency must be a three-letter code.'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be text.')
    .trim()
    .isLength({ max: 64 })
    .withMessage('Timezone must not exceed 64 characters.')
    .matches(TIMEZONE_PATTERN)
    .withMessage('Timezone must be UTC or a valid IANA-style timezone.'),
  body('weeklyAvailability')
    .optional()
    .isArray({ max: 35 })
    .withMessage('Weekly availability must contain no more than 35 slots.')
    .custom(isValidWeeklyAvailability)
    .withMessage('Weekly availability must contain valid, non-overlapping slots.'),
  body('weeklyAvailability.*.dayOfWeek')
    .isIn(WEEK_DAYS)
    .withMessage('Availability day is invalid.'),
  body('weeklyAvailability.*.startTime')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Availability start time must use HH:mm format.'),
  body('weeklyAvailability.*.endTime')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Availability end time must use HH:mm format.'),
];

export const updateLawyerProfileValidator = [
  body().custom((requestBody) => {
    if (!containsOnlyKeys(requestBody, ALLOWED_PROFILE_FIELDS)) {
      throw new Error('Request contains unsupported lawyer profile fields.');
    }

    if (Object.keys(requestBody).length === 0) {
      throw new Error('At least one lawyer profile field must be provided.');
    }

    if (
      requestBody.consultationFee &&
      !containsOnlyKeys(requestBody.consultationFee, ALLOWED_FEE_FIELDS)
    ) {
      throw new Error('Consultation fee contains unsupported fields.');
    }

    if (
      Array.isArray(requestBody.weeklyAvailability) &&
      requestBody.weeklyAvailability.some(
        (slot) => !containsOnlyKeys(slot, ALLOWED_SLOT_FIELDS),
      )
    ) {
      throw new Error('Availability contains unsupported fields.');
    }

    return true;
  }),
  body('professionalTitle')
    .optional()
    .isString()
    .withMessage('Professional title must be text.')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Professional title must be between 2 and 120 characters.'),
  body('biography')
    .optional()
    .isString()
    .withMessage('Biography must be text.')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Biography must be between 20 and 2000 characters.'),
  body('specializations')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Specializations must contain between 1 and 10 entries.')
    .custom((values) => {
      const normalizedValues = values.map((value) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
      );
      return new Set(normalizedValues).size === normalizedValues.length;
    })
    .withMessage('Specializations must be unique.'),
  body('specializations.*')
    .isString()
    .withMessage('Each specialization must be text.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Each specialization must be between 2 and 80 characters.'),
  body('yearsOfExperience')
    .optional()
    .custom(Number.isInteger)
    .withMessage('Years of experience must be a whole number.')
    .isInt({ min: 0, max: 70 })
    .withMessage('Years of experience must be between 0 and 70.'),
  body('consultationFee')
    .optional()
    .isObject({ strict: true })
    .withMessage('Consultation fee must be an object.'),
  body('consultationFee.amount')
    .if(body('consultationFee').exists())
    .custom((value) => Number.isFinite(value))
    .withMessage('Consultation fee amount must be a number.')
    .isFloat({ min: 0, max: 1_000_000 })
    .withMessage('Consultation fee amount must be between 0 and 1000000.'),
  body('consultationFee.currency')
    .if(body('consultationFee').exists())
    .isString()
    .withMessage('Consultation fee currency must be text.')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{3}$/)
    .withMessage('Consultation fee currency must be a three-letter code.'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be text.')
    .trim()
    .isLength({ max: 64 })
    .withMessage('Timezone must not exceed 64 characters.')
    .matches(TIMEZONE_PATTERN)
    .withMessage('Timezone must be UTC or a valid IANA-style timezone.'),
  body('weeklyAvailability')
    .optional()
    .isArray({ max: 35 })
    .withMessage('Weekly availability must contain no more than 35 slots.')
    .custom(isValidWeeklyAvailability)
    .withMessage('Weekly availability must contain valid, non-overlapping slots.'),
  body('weeklyAvailability.*.dayOfWeek')
    .isIn(WEEK_DAYS)
    .withMessage('Availability day is invalid.'),
  body('weeklyAvailability.*.startTime')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Availability start time must use HH:mm format.'),
  body('weeklyAvailability.*.endTime')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Availability end time must use HH:mm format.'),
];
