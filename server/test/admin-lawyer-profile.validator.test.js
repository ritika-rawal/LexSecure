import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';

import {
  listLawyerProfilesValidator,
  reviewLawyerProfileValidator,
} from '../src/validators/admin-lawyer-profile.validator.js';

const runValidation = async (validators, request) => {
  for (const validation of validators) {
    await validation.run(request);
  }
  return validationResult(request);
};

test('accepts valid bounded review-list parameters', async () => {
  const result = await runValidation(listLawyerProfilesValidator, {
    query: { status: 'pending', page: '2', limit: '25' },
  });

  assert.equal(result.isEmpty(), true);
});

test('rejects unknown list parameters and excessive page limits', async () => {
  const result = await runValidation(listLawyerProfilesValidator, {
    query: { limit: '51', unexpected: 'value' },
  });
  const messages = result.array().map((error) => error.msg);

  assert.ok(messages.includes('Request contains unsupported query parameters.'));
  assert.ok(messages.includes('Limit must be between 1 and 50.'));
});

test('accepts a valid profile approval decision', async () => {
  const result = await runValidation(reviewLawyerProfileValidator, {
    params: { profileId: '507f1f77bcf86cd799439011' },
    body: { decision: 'approved' },
  });

  assert.equal(result.isEmpty(), true);
});

test('rejects malformed IDs, invalid decisions, and extra review fields', async () => {
  const result = await runValidation(reviewLawyerProfileValidator, {
    params: { profileId: 'invalid-id' },
    body: { decision: 'pending', isVisible: true },
  });
  const messages = result.array().map((error) => error.msg);

  assert.ok(messages.includes('Profile ID must be a valid MongoDB identifier.'));
  assert.ok(messages.includes('Request must contain only the review decision.'));
  assert.ok(messages.includes('Decision must be approved or rejected.'));
});
