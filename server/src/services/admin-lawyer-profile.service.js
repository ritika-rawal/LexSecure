import { LAWYER_APPROVAL_STATUS } from '../constants/lawyer-profile.js';
import { LawyerProfile } from '../models/LawyerProfile.model.js';

const createProfileNotFoundError = () => {
  const error = new Error('Lawyer profile not found.');
  error.statusCode = 404;
  return error;
};

export const listLawyerProfilesForReview = async ({ status, page, limit }) => {
  const filter = { approvalStatus: status };
  const skip = (page - 1) * limit;

  const [profiles, totalItems] = await Promise.all([
    LawyerProfile.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName email role isActive')
      .exec(),
    LawyerProfile.countDocuments(filter),
  ]);

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

export const reviewLawyerProfile = async ({ profileId, adminId, decision }) => {
  const profile = await LawyerProfile.findById(profileId);

  if (!profile) {
    throw createProfileNotFoundError();
  }

  if (profile.approvalStatus !== LAWYER_APPROVAL_STATUS.PENDING) {
    const error = new Error('Only pending lawyer profiles can be reviewed.');
    error.statusCode = 409;
    throw error;
  }

  profile.set('approvalStatus', decision);
  profile.set('isVisible', decision === LAWYER_APPROVAL_STATUS.APPROVED);
  profile.set('reviewedBy', adminId);
  profile.set('reviewedAt', new Date());

  await profile.save();
  await profile.populate('user', 'fullName email role isActive');
  return profile;
};
