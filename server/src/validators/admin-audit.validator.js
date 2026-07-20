import { query } from 'express-validator';

import {
  AUDIT_ACTION_VALUES,
  AUDIT_ACTOR_ROLE_VALUES,
  AUDIT_OUTCOME_VALUES,
  AUDIT_TARGET_TYPE_VALUES,
} from '../constants/audit.js';

const ALLOWED_AUDIT_QUERY_FIELDS = new Set([
  'action',
  'outcome',
  'actorRole',
  'targetType',
  'requestId',
  'targetId',
  'from',
  'to',
  'page',
  'limit',
]);

export const listAuditLogsValidator = [
  query().custom((queryValues) => {
    if (
      !queryValues
      || typeof queryValues !== 'object'
      || Array.isArray(queryValues)
      || !Object.keys(queryValues).every((key) =>
        ALLOWED_AUDIT_QUERY_FIELDS.has(key))
    ) {
      throw new Error('Request contains unsupported audit-log filters.');
    }

    if (
      queryValues.from
      && queryValues.to
      && new Date(queryValues.from).getTime() > new Date(queryValues.to).getTime()
    ) {
      throw new Error('From date must not be later than to date.');
    }

    return true;
  }),
  query('action')
    .optional()
    .isIn(AUDIT_ACTION_VALUES)
    .withMessage('Action filter is invalid.'),
  query('outcome')
    .optional()
    .isIn(AUDIT_OUTCOME_VALUES)
    .withMessage('Outcome filter is invalid.'),
  query('actorRole')
    .optional()
    .isIn(AUDIT_ACTOR_ROLE_VALUES)
    .withMessage('Actor role filter is invalid.'),
  query('targetType')
    .optional()
    .isIn(AUDIT_TARGET_TYPE_VALUES)
    .withMessage('Target type filter is invalid.'),
  query('requestId')
    .optional()
    .isUUID(4)
    .withMessage('Request ID must be a valid UUID.'),
  query('targetId')
    .optional()
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB identifier.'),
  query('from')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('From date must be a valid ISO 8601 timestamp.')
    .toDate(),
  query('to')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('To date must be a valid ISO 8601 timestamp.')
    .toDate(),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100_000 })
    .withMessage('Page must be between 1 and 100000.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.')
    .toInt(),
];
