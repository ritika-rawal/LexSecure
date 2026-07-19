import { body } from 'express-validator';

import { CONSULTATION_TYPE_VALUES } from '../constants/appointment.js';
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
