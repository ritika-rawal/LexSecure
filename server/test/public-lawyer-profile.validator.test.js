import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';

import {
  getPublicLawyerProfileValidator,
  listPublicLawyerProfilesValidator,
} from '../src/validators/public-lawyer-profile.validator.js';

const runValidation = async (validators, request) => {
  for (const validation of validators) {
    await validation.run(request);
  }

  return validationResult(request);
};

test('accepts and normalizes bounded lawyer discovery parameters', async () => {
  const request = {
    query: {
      page: '2',
      limit: '20',
      specialization: '  Family Law  ',
    },
  };
  const result = await runValidation(listPublicLawyerProfilesValidator, request);

  assert.equal(result.isEmpty(), true);
  assert.equal(request.query.page, 2);
  assert.equal(request.query.limit, 20);
  assert.equal(request.query.specialization, 'Family Law');
});

test('rejects unsupported and excessive discovery parameters', async () => {
  const result = await runValidation(listPublicLawyerProfilesValidator, {
    query: {
      limit: '100',
      search: 'private query',
    },
  });
  const messages = result.array().map((error) => error.msg);

  assert.ok(messages.includes('Request contains unsupported query parameters.'));
  assert.ok(messages.includes('Limit must be between 1 and 50.'));
});

test('validates public lawyer profile identifiers', async () => {
  const invalidResult = await runValidation(getPublicLawyerProfileValidator, {
    params: { profileId: 'invalid-id' },
  });
  const validResult = await runValidation(getPublicLawyerProfileValidator, {
    params: { profileId: '507f1f77bcf86cd799439011' },
  });

  assert.equal(invalidResult.isEmpty(), false);
  assert.equal(validResult.isEmpty(), true);
});
