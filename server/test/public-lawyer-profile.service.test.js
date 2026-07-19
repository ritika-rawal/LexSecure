import assert from 'node:assert/strict';
import test from 'node:test';

import { LAWYER_APPROVAL_STATUS } from '../src/constants/lawyer-profile.js';
import { USER_ROLES } from '../src/constants/user-roles.js';
import { LawyerProfile } from '../src/models/LawyerProfile.model.js';
import {
  getPublicLawyerProfile,
  listPublicLawyerProfiles,
} from '../src/services/public-lawyer-profile.service.js';

test('lists only approved visible profiles for active lawyer accounts', async () => {
  const originalAggregate = LawyerProfile.aggregate;
  let capturedPipeline;

  LawyerProfile.aggregate = async (pipeline) => {
    capturedPipeline = pipeline;
    return [{
      profiles: [{ _id: 'profile-id' }],
      metadata: [{ totalItems: 13 }],
    }];
  };

  try {
    const result = await listPublicLawyerProfiles({
      page: 2,
      limit: 5,
      specialization: 'Family.*',
    });
    const firstMatch = capturedPipeline[0].$match;
    const accountMatch = capturedPipeline.find(
      (stage) => stage.$match?.['lawyer.isActive'] === true,
    ).$match;
    const facet = capturedPipeline.find((stage) => stage.$facet).$facet;

    assert.equal(firstMatch.approvalStatus, LAWYER_APPROVAL_STATUS.APPROVED);
    assert.equal(firstMatch.isVisible, true);
    assert.equal(firstMatch.specializations.source, '^Family\\.\\*$');
    assert.equal(accountMatch['lawyer.role'], USER_ROLES.LAWYER);
    assert.equal(facet.profiles[0].$skip, 5);
    assert.equal(facet.profiles[1].$limit, 5);
    assert.equal(result.pagination.totalItems, 13);
    assert.equal(result.pagination.totalPages, 3);
  } finally {
    LawyerProfile.aggregate = originalAggregate;
  }
});

test('returns an approved public profile by ID', async () => {
  const originalAggregate = LawyerProfile.aggregate;
  LawyerProfile.aggregate = async () => [{ _id: 'profile-id' }];

  try {
    const profile = await getPublicLawyerProfile('507f1f77bcf86cd799439011');
    assert.equal(profile._id, 'profile-id');
  } finally {
    LawyerProfile.aggregate = originalAggregate;
  }
});

test('returns 404 when a public profile is unavailable', async () => {
  const originalAggregate = LawyerProfile.aggregate;
  LawyerProfile.aggregate = async () => [];

  try {
    await assert.rejects(
      () => getPublicLawyerProfile('507f1f77bcf86cd799439011'),
      (error) => error.statusCode === 404,
    );
  } finally {
    LawyerProfile.aggregate = originalAggregate;
  }
});
