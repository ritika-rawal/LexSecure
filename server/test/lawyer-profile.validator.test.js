import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';

import {
  createLawyerProfileValidator,
  updateLawyerProfileValidator,
} from '../src/validators/lawyer-profile.validator.js';

const validBody = {
  professionalTitle: 'Solicitor and Legal Consultant',
  biography:
    'Experienced legal professional providing carefully considered client consultations.',
  specializations: ['Family Law'],
  yearsOfExperience: 8,
  consultationFee: { amount: 5000, currency: 'NPR' },
  timezone: 'Asia/Kathmandu',
  weeklyAvailability: [
    { dayOfWeek: 'monday', startTime: '09:00', endTime: '12:00' },
  ],
};

const runValidation = async (body, validators = createLawyerProfileValidator) => {
  const req = { body };

  for (const validation of validators) {
    await validation.run(req);
  }

  return validationResult(req);
};

test('accepts a valid lawyer profile request', async () => {
  const result = await runValidation(structuredClone(validBody));

  assert.equal(result.isEmpty(), true);
});

test('rejects privileged and unknown top-level fields', async () => {
  const result = await runValidation({
    ...structuredClone(validBody),
    user: 'attacker-controlled-id',
    approvalStatus: 'approved',
    isVisible: true,
  });

  assert.equal(result.isEmpty(), false);
  assert.match(result.array()[0].msg, /unsupported lawyer profile fields/);
});

test('rejects unknown nested fields and overlapping availability', async () => {
  const requestBody = structuredClone(validBody);
  requestBody.consultationFee.override = true;
  requestBody.weeklyAvailability.push({
    dayOfWeek: 'monday',
    startTime: '11:00',
    endTime: '13:00',
  });

  const result = await runValidation(requestBody);
  const messages = result.array().map((error) => error.msg);

  assert.ok(messages.includes('Consultation fee contains unsupported fields.'));
  assert.ok(
    messages.includes('Weekly availability must contain valid, non-overlapping slots.'),
  );
});

test('accepts a valid partial lawyer profile update', async () => {
  const result = await runValidation(
    {
      weeklyAvailability: [
        { dayOfWeek: 'friday', startTime: '10:00', endTime: '14:00' },
      ],
    },
    updateLawyerProfileValidator,
  );

  assert.equal(result.isEmpty(), true);
});

test('rejects empty updates and privileged fields', async () => {
  const emptyResult = await runValidation({}, updateLawyerProfileValidator);
  const privilegedResult = await runValidation(
    { approvalStatus: 'approved' },
    updateLawyerProfileValidator,
  );

  assert.ok(
    emptyResult
      .array()
      .some((error) => error.msg === 'At least one lawyer profile field must be provided.'),
  );
  assert.ok(
    privilegedResult
      .array()
      .some((error) => error.msg === 'Request contains unsupported lawyer profile fields.'),
  );
});

test('requires a complete consultation fee object when updating the fee', async () => {
  const result = await runValidation(
    { consultationFee: { amount: 7500 } },
    updateLawyerProfileValidator,
  );

  assert.ok(
    result
      .array()
      .some((error) => error.path === 'consultationFee.currency'),
  );
});
