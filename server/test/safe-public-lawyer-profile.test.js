import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSafePublicLawyerProfileResponse } from '../src/utils/safe-public-lawyer-profile.js';

test('returns only allowlisted public lawyer profile fields', () => {
  const response = buildSafePublicLawyerProfileResponse({
    _id: { toString: () => 'profile-id' },
    lawyer: {
      fullName: 'Public Lawyer',
      email: 'private@example.com',
      passwordHash: 'private',
    },
    professionalTitle: 'Solicitor',
    biography: 'Public professional biography.',
    specializations: ['Family Law'],
    yearsOfExperience: 5,
    consultationFee: { amount: 5000, currency: 'NPR' },
    timezone: 'Asia/Kathmandu',
    weeklyAvailability: [],
    approvalStatus: 'approved',
    isVisible: true,
    reviewedBy: 'private-admin-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.deepEqual(response.lawyer, { fullName: 'Public Lawyer' });
  assert.equal(Object.hasOwn(response, 'approvalStatus'), false);
  assert.equal(Object.hasOwn(response, 'isVisible'), false);
  assert.equal(Object.hasOwn(response, 'reviewedBy'), false);
  assert.equal(Object.hasOwn(response, 'userId'), false);
  assert.equal(Object.hasOwn(response.lawyer, 'email'), false);
});
