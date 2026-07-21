import { body, query } from 'express-validator';

import {
  ACCOUNT_IMPORT_LIMITS,
  ACCOUNT_IMPORT_VERSION,
  DANGEROUS_IMPORT_KEYS,
} from '../constants/account-import.js';
import { WEEK_DAYS } from '../constants/lawyer-profile.js';
import { USER_ROLES } from '../constants/user-roles.js';
import {
  isValidWeeklyAvailability,
  TIME_24_HOUR_PATTERN,
} from '../utils/availability.js';

const CLIENT_TOP_LEVEL_FIELDS = new Set(['importVersion', 'account']);
const CLIENT_ACCOUNT_FIELDS = new Set(['fullName']);
const LAWYER_TOP_LEVEL_FIELDS = new Set(['importVersion', 'lawyerProfile']);
const LAWYER_PROFILE_FIELDS = new Set([
  'professionalTitle',
  'biography',
  'specializations',
  'yearsOfExperience',
  'consultationFee',
  'timezone',
  'weeklyAvailability',
]);
const FEE_FIELDS = new Set(['amount', 'currency']);
const SLOT_FIELDS = new Set(['dayOfWeek', 'startTime', 'endTime']);
const TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/;
const dangerousImportKeySet = new Set(DANGEROUS_IMPORT_KEYS);

const containsExactly = (value, allowedKeys) =>
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).length === allowedKeys.size
  && Object.keys(value).every((key) => allowedKeys.has(key));

const assertSafeObjectGraph = (root) => {
  const stack = [{ value: root, depth: 0 }];
  let nodeCount = 0;

  while (stack.length > 0) {
    const { value, depth } = stack.pop();

    if (!value || typeof value !== 'object') continue;
    nodeCount += 1;

    if (
      depth > ACCOUNT_IMPORT_LIMITS.MAXIMUM_OBJECT_DEPTH
      || nodeCount > ACCOUNT_IMPORT_LIMITS.MAXIMUM_OBJECT_NODES
    ) {
      throw new Error('Import payload structure exceeds the permitted complexity.');
    }

    Object.keys(value).forEach((key) => {
      if (dangerousImportKeySet.has(key)) {
        throw new Error('Import payload contains a prohibited property name.');
      }
      stack.push({ value: value[key], depth: depth + 1 });
    });
  }
};

const validateEnvelope = (requestBody, role) => {
  assertSafeObjectGraph(requestBody);

  if (
    Buffer.byteLength(JSON.stringify(requestBody), 'utf8')
      > ACCOUNT_IMPORT_LIMITS.MAXIMUM_PAYLOAD_BYTES
  ) {
    throw new Error('Import payload exceeds the 64 KB limit.');
  }

  if (role === USER_ROLES.CLIENT) {
    if (
      !containsExactly(requestBody, CLIENT_TOP_LEVEL_FIELDS)
      || !containsExactly(requestBody.account, CLIENT_ACCOUNT_FIELDS)
    ) {
      throw new Error('Client import contains unsupported fields.');
    }
    return true;
  }

  if (
    role !== USER_ROLES.LAWYER
    || !containsExactly(requestBody, LAWYER_TOP_LEVEL_FIELDS)
    || !containsExactly(requestBody.lawyerProfile, LAWYER_PROFILE_FIELDS)
    || !containsExactly(requestBody.lawyerProfile.consultationFee, FEE_FIELDS)
    || !Array.isArray(requestBody.lawyerProfile.weeklyAvailability)
    || requestBody.lawyerProfile.weeklyAvailability.some(
      (slot) => !containsExactly(slot, SLOT_FIELDS),
    )
  ) {
    throw new Error('Lawyer import contains unsupported fields.');
  }

  return true;
};

export const accountImportValidator = [
  query().custom((queryValues) => {
    if (queryValues && Object.keys(queryValues).length > 0) {
      throw new Error('Account import does not accept query parameters.');
    }
    return true;
  }),
  body().custom((requestBody, { req }) => validateEnvelope(requestBody, req.user.role)),
  body('importVersion')
    .equals(String(ACCOUNT_IMPORT_VERSION))
    .withMessage(`Import version must be ${ACCOUNT_IMPORT_VERSION}.`)
    .toInt(),
  body('account.fullName')
    .if((value, { req }) => req.user.role === USER_ROLES.CLIENT)
    .isString()
    .withMessage('Full name must be text.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('lawyerProfile.professionalTitle')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isString().withMessage('Professional title must be text.')
    .bail().trim().isLength({ min: 2, max: 120 })
    .withMessage('Professional title must be between 2 and 120 characters.'),
  body('lawyerProfile.biography')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isString().withMessage('Biography must be text.')
    .bail().trim().isLength({ min: 20, max: 2000 })
    .withMessage('Biography must be between 20 and 2000 characters.'),
  body('lawyerProfile.specializations')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isArray({ min: 1, max: 10 })
    .withMessage('Specializations must contain between 1 and 10 entries.')
    .custom((values) => {
      const normalized = values.map((value) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value);
      return new Set(normalized).size === normalized.length;
    })
    .withMessage('Specializations must be unique.'),
  body('lawyerProfile.specializations.*')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isString().withMessage('Each specialization must be text.')
    .bail().trim().isLength({ min: 2, max: 80 })
    .withMessage('Each specialization must be between 2 and 80 characters.'),
  body('lawyerProfile.yearsOfExperience')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .custom(Number.isInteger).withMessage('Years of experience must be a whole number.')
    .bail().isInt({ min: 0, max: 70 })
    .withMessage('Years of experience must be between 0 and 70.'),
  body('lawyerProfile.consultationFee.amount')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .custom(Number.isFinite).withMessage('Consultation fee amount must be a number.')
    .bail().isFloat({ min: 0, max: 1_000_000 })
    .withMessage('Consultation fee amount must be between 0 and 1000000.'),
  body('lawyerProfile.consultationFee.currency')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isString().withMessage('Consultation fee currency must be text.')
    .bail().trim().toUpperCase().matches(/^[A-Z]{3}$/)
    .withMessage('Consultation fee currency must be a three-letter code.'),
  body('lawyerProfile.timezone')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isString().withMessage('Timezone must be text.')
    .bail().trim().isLength({ max: 64 })
    .matches(TIMEZONE_PATTERN)
    .withMessage('Timezone must be UTC or a valid IANA-style timezone.'),
  body('lawyerProfile.weeklyAvailability')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isArray({ max: 35 })
    .withMessage('Weekly availability must contain no more than 35 slots.')
    .custom(isValidWeeklyAvailability)
    .withMessage('Weekly availability must contain valid, non-overlapping slots.'),
  body('lawyerProfile.weeklyAvailability.*.dayOfWeek')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .isIn(WEEK_DAYS).withMessage('Availability day is invalid.'),
  body('lawyerProfile.weeklyAvailability.*.startTime')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .matches(TIME_24_HOUR_PATTERN).withMessage('Availability start time must use HH:mm format.'),
  body('lawyerProfile.weeklyAvailability.*.endTime')
    .if((value, { req }) => req.user.role === USER_ROLES.LAWYER)
    .matches(TIME_24_HOUR_PATTERN).withMessage('Availability end time must use HH:mm format.'),
];
