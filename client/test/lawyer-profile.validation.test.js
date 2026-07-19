import assert from 'node:assert/strict';
import test from 'node:test';

import { profileFormToPayload } from '../src/features/lawyers/utils/profileForm.js';
import { validateLawyerProfile } from '../src/features/lawyers/validation/lawyerProfile.validation.js';

const validValues = {
  professionalTitle: 'Solicitor and Legal Consultant',
  biography:
    'Experienced legal professional providing carefully considered client consultations.',
  specializations: ['Family Law'],
  yearsOfExperience: '8',
  consultationFeeAmount: '5000',
  consultationFeeCurrency: 'NPR',
  timezone: 'Asia/Kathmandu',
  weeklyAvailability: [
    {
      rowId: 'client-only-row-id',
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '12:00',
    },
  ],
};

test('accepts valid lawyer profile form data', () => {
  assert.deepEqual(validateLawyerProfile(validValues), {});
});

test('rejects duplicate specializations and overlapping availability', () => {
  const errors = validateLawyerProfile({
    ...validValues,
    specializations: ['Family Law', 'family law'],
    weeklyAvailability: [
      ...validValues.weeklyAvailability,
      {
        rowId: 'second-row',
        dayOfWeek: 'monday',
        startTime: '11:00',
        endTime: '13:00',
      },
    ],
  });

  assert.ok(errors.specializations);
  assert.ok(errors.weeklyAvailability);
});

test('strips client-only row identifiers from the API payload', () => {
  const payload = profileFormToPayload(validValues);

  assert.equal(Object.hasOwn(payload.weeklyAvailability[0], 'rowId'), false);
  assert.equal(payload.yearsOfExperience, 8);
  assert.equal(payload.consultationFee.amount, 5000);
});
