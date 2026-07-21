import { body, param } from 'express-validator';

import { IP_ACCESS_RULE_TYPE_VALUES } from '../constants/ip-access.js';
import { parseIpNetwork } from '../utils/ip-network.js';

const CREATE_FIELDS = new Set(['type', 'network', 'description', 'isActive']);

export const createIpAccessRuleValidator = [
  body().custom((requestBody) => {
    const keys = requestBody && typeof requestBody === 'object'
      ? Object.keys(requestBody)
      : [];

    if (
      !keys.includes('type')
      || !keys.includes('network')
      || !keys.every((key) => CREATE_FIELDS.has(key))
    ) {
      throw new Error('Request contains unsupported IP access rule fields.');
    }

    return true;
  }),
  body('type')
    .isIn(IP_ACCESS_RULE_TYPE_VALUES)
    .withMessage('Rule type must be allow or block.'),
  body('network')
    .isString()
    .withMessage('Network must be text.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 135 })
    .withMessage('Network must be between 2 and 135 characters.')
    .bail()
    .custom((value) => {
      parseIpNetwork(value);
      return true;
    }),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be text.')
    .bail()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Description must not exceed 120 characters.'),
  body('isActive')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('Active status must be a boolean.'),
];

export const updateIpAccessRuleValidator = [
  param('ruleId').isMongoId().withMessage('Rule ID is invalid.'),
  body().custom((requestBody) => {
    if (
      !requestBody
      || typeof requestBody !== 'object'
      || Array.isArray(requestBody)
      || Object.keys(requestBody).length !== 1
      || !Object.hasOwn(requestBody, 'isActive')
    ) {
      throw new Error('Request must contain isActive only.');
    }

    return true;
  }),
  body('isActive')
    .isBoolean({ strict: true })
    .withMessage('Active status must be a boolean.'),
];

export const deleteIpAccessRuleValidator = [
  param('ruleId').isMongoId().withMessage('Rule ID is invalid.'),
];
