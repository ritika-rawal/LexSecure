import { body, param, query } from 'express-validator';

import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_VALUES,
  CONSULTATION_TYPE_VALUES,
} from '../constants/appointment.js';
import { TIME_24_HOUR_PATTERN } from '../utils/availability.js';
import { isValidLocalDate } from '../utils/timezone.js';

const ALLOWED_BOOKING_FIELDS = new Set([
  'lawyerProfileId',
  'appointmentDate',
  'startTime',
  'endTime',
  'consultationType',
  'legalIssueSummary',
]);

export const createAppointmentValidator = [
  body().custom((requestBody) => {
    const containsOnlyAllowedFields =
      requestBody
      && typeof requestBody === 'object'
      && !Array.isArray(requestBody)
      && Object.keys(requestBody).every((key) => ALLOWED_BOOKING_FIELDS.has(key));

    if (!containsOnlyAllowedFields) {
      throw new Error('Request contains unsupported appointment fields.');
    }

    return true;
  }),
  body('lawyerProfileId')
    .isMongoId()
    .withMessage('Lawyer profile ID must be a valid MongoDB identifier.'),
  body('appointmentDate')
    .isString()
    .withMessage('Appointment date must be text.')
    .custom(isValidLocalDate)
    .withMessage('Appointment date must be a valid date in YYYY-MM-DD format.'),
  body('startTime')
    .isString()
    .withMessage('Start time must be text.')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Start time must use HH:mm format.'),
  body('endTime')
    .isString()
    .withMessage('End time must be text.')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('End time must use HH:mm format.'),
  body('consultationType')
    .isString()
    .withMessage('Consultation type must be text.')
    .trim()
    .toLowerCase()
    .isIn(CONSULTATION_TYPE_VALUES)
    .withMessage('Consultation type must be video, phone, or in_person.'),
  body('legalIssueSummary')
    .isString()
    .withMessage('Legal issue summary must be text.')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Legal issue summary must be between 20 and 1000 characters.'),
];

const ALLOWED_LAWYER_LIST_QUERY_FIELDS = new Set(['page', 'limit']);

export const listLawyerAppointmentsValidator = [
  query().custom((queryParameters) => {
    const containsOnlyAllowedFields = Object.keys(queryParameters).every((key) =>
      ALLOWED_LAWYER_LIST_QUERY_FIELDS.has(key),
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
];

export const reviewAppointmentValidator = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Appointment ID must be a valid MongoDB identifier.'),
  body().custom((requestBody) => {
    const containsOnlyDecision =
      requestBody
      && typeof requestBody === 'object'
      && !Array.isArray(requestBody)
      && Object.keys(requestBody).length === 1
      && Object.hasOwn(requestBody, 'decision');

    if (!containsOnlyDecision) {
      throw new Error('Request must contain only the appointment decision.');
    }

    return true;
  }),
  body('decision')
    .isString()
    .withMessage('Decision must be text.')
    .trim()
    .toLowerCase()
    .isIn([
      APPOINTMENT_STATUS.APPROVED,
      APPOINTMENT_STATUS.REJECTED,
    ])
    .withMessage('Decision must be approved or rejected.'),
];

const ALLOWED_DASHBOARD_QUERY_FIELDS = new Set(['status', 'page', 'limit']);

export const listMyAppointmentsValidator = [
  query().custom((queryParameters) => {
    const containsOnlyAllowedFields = Object.keys(queryParameters).every((key) =>
      ALLOWED_DASHBOARD_QUERY_FIELDS.has(key),
    );

    if (!containsOnlyAllowedFields) {
      throw new Error('Request contains unsupported query parameters.');
    }

    return true;
  }),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be text.')
    .trim()
    .toLowerCase()
    .isIn(APPOINTMENT_STATUS_VALUES)
    .withMessage('Appointment status is invalid.'),
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
];

export const cancelAppointmentValidator = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Appointment ID must be a valid MongoDB identifier.'),
  body().custom((requestBody) => {
    const containsOnlyReason =
      requestBody
      && typeof requestBody === 'object'
      && !Array.isArray(requestBody)
      && Object.keys(requestBody).length === 1
      && Object.hasOwn(requestBody, 'reason');

    if (!containsOnlyReason) {
      throw new Error('Request must contain only the cancellation reason.');
    }

    return true;
  }),
  body('reason')
    .isString()
    .withMessage('Cancellation reason must be text.')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters.'),
];

const ALLOWED_RESCHEDULE_FIELDS = new Set([
  'appointmentDate',
  'startTime',
  'endTime',
]);

export const rescheduleAppointmentValidator = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Appointment ID must be a valid MongoDB identifier.'),
  body().custom((requestBody) => {
    const containsOnlyAllowedFields =
      requestBody
      && typeof requestBody === 'object'
      && !Array.isArray(requestBody)
      && Object.keys(requestBody).length === ALLOWED_RESCHEDULE_FIELDS.size
      && Object.keys(requestBody).every((key) =>
        ALLOWED_RESCHEDULE_FIELDS.has(key));

    if (!containsOnlyAllowedFields) {
      throw new Error(
        'Request must contain only the appointment date, start time, and end time.',
      );
    }

    return true;
  }),
  body('appointmentDate')
    .isString()
    .withMessage('Appointment date must be text.')
    .custom(isValidLocalDate)
    .withMessage('Appointment date must be a valid date in YYYY-MM-DD format.'),
  body('startTime')
    .isString()
    .withMessage('Start time must be text.')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('Start time must use HH:mm format.'),
  body('endTime')
    .isString()
    .withMessage('End time must be text.')
    .matches(TIME_24_HOUR_PATTERN)
    .withMessage('End time must use HH:mm format.'),
];
