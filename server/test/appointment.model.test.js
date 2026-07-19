import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

import {
  APPOINTMENT_STATUS,
  CONSULTATION_TYPES,
} from '../src/constants/appointment.js';
import { Appointment } from '../src/models/Appointment.model.js';
import { LawyerProfile } from '../src/models/LawyerProfile.model.js';
import { User } from '../src/models/User.model.js';

const createValidAppointment = (overrides = {}) => {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return new Appointment({
    client: new mongoose.Types.ObjectId(),
    lawyer: new mongoose.Types.ObjectId(),
    lawyerProfile: new mongoose.Types.ObjectId(),
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    timezone: 'Asia/Kathmandu',
    consultationType: CONSULTATION_TYPES.VIDEO,
    legalIssueSummary:
      'I need confidential advice regarding a contractual disagreement.',
    ...overrides,
  });
};

const withValidReferences = async (callback) => {
  const originalUserExists = User.exists;
  const originalProfileExists = LawyerProfile.exists;
  User.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  LawyerProfile.exists = async () => ({ _id: new mongoose.Types.ObjectId() });

  try {
    await callback();
  } finally {
    User.exists = originalUserExists;
    LawyerProfile.exists = originalProfileExists;
  }
};

test('applies a pending status and hides the legal summary from JSON', () => {
  const appointment = createValidAppointment();
  const response = appointment.toJSON();

  assert.equal(appointment.status, APPOINTMENT_STATUS.PENDING);
  assert.equal(Object.hasOwn(response, 'legalIssueSummary'), false);
});

test('accepts a valid future appointment with matching references', async () => {
  await withValidReferences(async () => {
    await assert.doesNotReject(() => createValidAppointment().validate());
  });
});

test('rejects appointments scheduled in the past', async () => {
  const startsAt = new Date(Date.now() - 60 * 60 * 1000);

  await withValidReferences(async () => {
    await assert.rejects(
      () => createValidAppointment({
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
      }).validate(),
      (error) =>
        error.errors.startsAt?.message ===
        'Appointment start time must be in the future.',
    );
  });
});

test('rejects appointments outside the allowed duration', async () => {
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await withValidReferences(async () => {
    await assert.rejects(
      () => createValidAppointment({
        startsAt,
        endsAt: new Date(startsAt.getTime() + 5 * 60 * 1000),
      }).validate(),
      (error) => Boolean(error.errors.endsAt),
    );
  });
});

test('rejects a lawyer profile that does not belong to the lawyer', async () => {
  const originalUserExists = User.exists;
  const originalProfileExists = LawyerProfile.exists;
  User.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  LawyerProfile.exists = async () => null;

  try {
    await assert.rejects(
      () => createValidAppointment().validate(),
      (error) =>
        error.errors.lawyerProfile?.message ===
        'Appointment profile must belong to the selected lawyer.',
    );
  } finally {
    User.exists = originalUserExists;
    LawyerProfile.exists = originalProfileExists;
  }
});

test('rejects unsupported appointment status and consultation type', () => {
  const appointment = createValidAppointment({
    status: 'secret_admin_status',
    consultationType: 'unvalidated_channel',
  });
  const error = appointment.validateSync();

  assert.ok(error.errors.status);
  assert.ok(error.errors.consultationType);
});
