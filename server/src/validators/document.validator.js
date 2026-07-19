import { param, query } from 'express-validator';

const ALLOWED_DOCUMENT_LIST_QUERY_FIELDS = new Set(['page', 'limit']);

export const appointmentDocumentParamValidator = [
  param('appointmentId')
    .isMongoId()
    .withMessage('Appointment ID must be a valid MongoDB identifier.'),
];

export const listAppointmentDocumentsValidator = [
  ...appointmentDocumentParamValidator,
  query().custom((queryParameters) => {
    const containsOnlyAllowedFields = Object.keys(queryParameters).every((key) =>
      ALLOWED_DOCUMENT_LIST_QUERY_FIELDS.has(key),
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

export const downloadDocumentValidator = [
  param('documentId')
    .isMongoId()
    .withMessage('Document ID must be a valid MongoDB identifier.'),
];
