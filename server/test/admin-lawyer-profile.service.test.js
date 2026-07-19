import assert from 'node:assert/strict';
import test from 'node:test';

import { LAWYER_APPROVAL_STATUS } from '../src/constants/lawyer-profile.js';
import { LawyerProfile } from '../src/models/LawyerProfile.model.js';
import {
  listLawyerProfilesForReview,
  reviewLawyerProfile,
} from '../src/services/admin-lawyer-profile.service.js';

const createPendingProfile = () => ({
  approvalStatus: LAWYER_APPROVAL_STATUS.PENDING,
  isVisible: false,
  reviewedBy: null,
  reviewedAt: null,
  set(field, value) {
    this[field] = value;
  },
  async save() {
    return this;
  },
  async populate() {
    return this;
  },
});

test('approval makes a pending profile visible and records the reviewer', async () => {
  const originalFindById = LawyerProfile.findById;
  const profile = createPendingProfile();
  LawyerProfile.findById = async () => profile;

  try {
    const result = await reviewLawyerProfile({
      profileId: 'profile-id',
      adminId: 'admin-id',
      decision: LAWYER_APPROVAL_STATUS.APPROVED,
    });

    assert.equal(result.approvalStatus, LAWYER_APPROVAL_STATUS.APPROVED);
    assert.equal(result.isVisible, true);
    assert.equal(result.reviewedBy, 'admin-id');
    assert.ok(result.reviewedAt instanceof Date);
  } finally {
    LawyerProfile.findById = originalFindById;
  }
});

test('rejection keeps a pending profile hidden', async () => {
  const originalFindById = LawyerProfile.findById;
  const profile = createPendingProfile();
  LawyerProfile.findById = async () => profile;

  try {
    const result = await reviewLawyerProfile({
      profileId: 'profile-id',
      adminId: 'admin-id',
      decision: LAWYER_APPROVAL_STATUS.REJECTED,
    });

    assert.equal(result.approvalStatus, LAWYER_APPROVAL_STATUS.REJECTED);
    assert.equal(result.isVisible, false);
  } finally {
    LawyerProfile.findById = originalFindById;
  }
});

test('rejects missing profiles and profiles that were already reviewed', async () => {
  const originalFindById = LawyerProfile.findById;

  try {
    LawyerProfile.findById = async () => null;
    await assert.rejects(
      () =>
        reviewLawyerProfile({
          profileId: 'missing',
          adminId: 'admin-id',
          decision: LAWYER_APPROVAL_STATUS.APPROVED,
        }),
      (error) => error.statusCode === 404,
    );

    LawyerProfile.findById = async () => ({
      approvalStatus: LAWYER_APPROVAL_STATUS.APPROVED,
    });
    await assert.rejects(
      () =>
        reviewLawyerProfile({
          profileId: 'reviewed',
          adminId: 'admin-id',
          decision: LAWYER_APPROVAL_STATUS.REJECTED,
        }),
      (error) => error.statusCode === 409,
    );
  } finally {
    LawyerProfile.findById = originalFindById;
  }
});

test('returns bounded pagination metadata for the review queue', async () => {
  const originalFind = LawyerProfile.find;
  const originalCountDocuments = LawyerProfile.countDocuments;
  const queryState = {};
  const query = {
    sort(value) {
      queryState.sort = value;
      return this;
    },
    skip(value) {
      queryState.skip = value;
      return this;
    },
    limit(value) {
      queryState.limit = value;
      return this;
    },
    populate() {
      return this;
    },
    async exec() {
      return [{ id: 'profile' }];
    },
  };

  LawyerProfile.find = () => query;
  LawyerProfile.countDocuments = async () => 21;

  try {
    const result = await listLawyerProfilesForReview({
      status: LAWYER_APPROVAL_STATUS.PENDING,
      page: 2,
      limit: 10,
    });

    assert.equal(queryState.skip, 10);
    assert.equal(queryState.limit, 10);
    assert.equal(result.pagination.totalItems, 21);
    assert.equal(result.pagination.totalPages, 3);
  } finally {
    LawyerProfile.find = originalFind;
    LawyerProfile.countDocuments = originalCountDocuments;
  }
});
