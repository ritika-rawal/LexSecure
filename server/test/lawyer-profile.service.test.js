import assert from 'node:assert/strict';
import test from 'node:test';

import { LawyerProfile } from '../src/models/LawyerProfile.model.js';
import {
  createLawyerProfile,
  getLawyerProfile,
  updateLawyerProfile,
} from '../src/services/lawyer-profile.service.js';

const profileData = {
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

test('rejects creation when the lawyer already has a profile', async () => {
  const originalExists = LawyerProfile.exists;
  LawyerProfile.exists = async () => ({ _id: 'existing-profile' });

  try {
    await assert.rejects(
      () => createLawyerProfile({ lawyerId: 'lawyer-id', profileData }),
      (error) => error.statusCode === 409,
    );
  } finally {
    LawyerProfile.exists = originalExists;
  }
});

test('persists only allowlisted profile fields with the authenticated lawyer id', async () => {
  const originalExists = LawyerProfile.exists;
  const originalCreate = LawyerProfile.create;
  let persistedData;

  LawyerProfile.exists = async () => null;
  LawyerProfile.create = async (data) => {
    persistedData = data;
    return data;
  };

  try {
    await createLawyerProfile({
      lawyerId: 'authenticated-lawyer-id',
      profileData: {
        ...profileData,
        user: 'attacker-controlled-id',
        isVisible: true,
        approvalStatus: 'approved',
      },
    });

    assert.equal(persistedData.user, 'authenticated-lawyer-id');
    assert.equal(Object.hasOwn(persistedData, 'isVisible'), false);
    assert.equal(Object.hasOwn(persistedData, 'approvalStatus'), false);
  } finally {
    LawyerProfile.exists = originalExists;
    LawyerProfile.create = originalCreate;
  }
});

test('returns 404 when the current lawyer profile does not exist', async () => {
  const originalFindOne = LawyerProfile.findOne;
  LawyerProfile.findOne = async () => null;

  try {
    await assert.rejects(
      () => getLawyerProfile('lawyer-id'),
      (error) => error.statusCode === 404,
    );
    await assert.rejects(
      () =>
        updateLawyerProfile({
          lawyerId: 'lawyer-id',
          profileData: { professionalTitle: 'Updated title' },
        }),
      (error) => error.statusCode === 404,
    );
  } finally {
    LawyerProfile.findOne = originalFindOne;
  }
});

test('updates only allowlisted fields and runs document validation on save', async () => {
  const originalFindOne = LawyerProfile.findOne;
  let saveCalled = false;
  const storedProfile = {
    professionalTitle: profileData.professionalTitle,
    isVisible: false,
    approvalStatus: 'pending',
    set(field, value) {
      this[field] = value;
    },
    async save() {
      saveCalled = true;
      return this;
    },
  };

  LawyerProfile.findOne = async () => storedProfile;

  try {
    const updatedProfile = await updateLawyerProfile({
      lawyerId: 'lawyer-id',
      profileData: {
        professionalTitle: 'Updated Professional Title',
        isVisible: true,
        approvalStatus: 'approved',
        user: 'different-user-id',
      },
    });

    assert.equal(updatedProfile.professionalTitle, 'Updated Professional Title');
    assert.equal(updatedProfile.isVisible, false);
    assert.equal(updatedProfile.approvalStatus, 'pending');
    assert.equal(Object.hasOwn(updatedProfile, 'user'), false);
    assert.equal(saveCalled, true);
  } finally {
    LawyerProfile.findOne = originalFindOne;
  }
});
