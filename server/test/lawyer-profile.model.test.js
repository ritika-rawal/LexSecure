import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import { LAWYER_APPROVAL_STATUS } from '../src/constants/lawyer-profile.js';
import { LawyerProfile } from '../src/models/LawyerProfile.model.js';
import { User } from '../src/models/User.model.js';

const createValidProfile = (overrides = {}) =>
  new LawyerProfile({
    user: new mongoose.Types.ObjectId(),
    professionalTitle: 'Solicitor and Legal Consultant',
    biography:
      'Experienced legal professional providing carefully considered client consultations.',
    specializations: ['Family Law', 'Contract Law'],
    yearsOfExperience: 8,
    consultationFee: {
      amount: 5000,
      currency: 'NPR',
    },
    timezone: 'Asia/Kathmandu',
    weeklyAvailability: [
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '12:00' },
    ],
    ...overrides,
  });

test('applies secure visibility and approval defaults', () => {
  const profile = createValidProfile();

  assert.equal(profile.isVisible, false);
  assert.equal(profile.approvalStatus, LAWYER_APPROVAL_STATUS.PENDING);
  assert.equal(profile.validateSync(), undefined);
});

test('rejects duplicate specializations regardless of letter case', () => {
  const profile = createValidProfile({
    specializations: ['Family Law', 'family law'],
  });
  const validationError = profile.validateSync();

  assert.ok(validationError.errors.specializations);
});

test('rejects non-integer experience and overlapping availability', () => {
  const profile = createValidProfile({
    yearsOfExperience: 3.5,
    weeklyAvailability: [
      { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'tuesday', startTime: '11:00', endTime: '13:00' },
    ],
  });
  const validationError = profile.validateSync();

  assert.ok(validationError.errors.yearsOfExperience);
  assert.ok(validationError.errors.weeklyAvailability);
});

test('requires the referenced user to have the lawyer role', async () => {
  const originalExists = User.exists;
  User.exists = async () => null;

  try {
    await assert.rejects(
      () => createValidProfile().validate(),
      (error) =>
        error.errors.user?.message ===
        'Lawyer profile must reference an existing lawyer account.',
    );
  } finally {
    User.exists = originalExists;
  }
});
