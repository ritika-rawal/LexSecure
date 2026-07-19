import mongoose from 'mongoose';

import { LAWYER_APPROVAL_STATUS } from '../constants/lawyer-profile.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { LawyerProfile } from '../models/LawyerProfile.model.js';

const { Types } = mongoose;

const PUBLIC_PROFILE_PROJECTION = Object.freeze({
  _id: 1,
  professionalTitle: 1,
  biography: 1,
  specializations: 1,
  yearsOfExperience: 1,
  consultationFee: 1,
  timezone: 1,
  weeklyAvailability: 1,
  createdAt: 1,
  updatedAt: 1,
  'lawyer.fullName': 1,
});

const createPublicProfileNotFoundError = () => {
  const error = new Error('Lawyer profile not found.');
  error.statusCode = 404;
  return error;
};

const escapeRegularExpression = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildApprovedProfileStages = ({ specialization } = {}) => {
  const profileFilter = {
    approvalStatus: LAWYER_APPROVAL_STATUS.APPROVED,
    isVisible: true,
  };

  if (specialization) {
    profileFilter.specializations = new RegExp(
      `^${escapeRegularExpression(specialization)}$`,
      'i',
    );
  }

  return [
    { $match: profileFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'lawyer',
      },
    },
    { $unwind: '$lawyer' },
    {
      $match: {
        'lawyer.role': USER_ROLES.LAWYER,
        'lawyer.isActive': true,
      },
    },
  ];
};

export const listPublicLawyerProfiles = async ({
  page,
  limit,
  specialization,
}) => {
  const skip = (page - 1) * limit;
  const [result] = await LawyerProfile.aggregate([
    ...buildApprovedProfileStages({ specialization }),
    { $sort: { createdAt: -1, _id: 1 } },
    {
      $facet: {
        profiles: [
          { $skip: skip },
          { $limit: limit },
          { $project: PUBLIC_PROFILE_PROJECTION },
        ],
        metadata: [{ $count: 'totalItems' }],
      },
    },
  ]);

  const profiles = result?.profiles || [];
  const totalItems = result?.metadata?.[0]?.totalItems || 0;

  return {
    profiles,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getPublicLawyerProfile = async (profileId) => {
  const [profile] = await LawyerProfile.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(profileId),
        approvalStatus: LAWYER_APPROVAL_STATUS.APPROVED,
        isVisible: true,
      },
    },
    ...buildApprovedProfileStages().slice(1),
    { $project: PUBLIC_PROFILE_PROJECTION },
    { $limit: 1 },
  ]);

  if (!profile) {
    throw createPublicProfileNotFoundError();
  }

  return profile;
};
