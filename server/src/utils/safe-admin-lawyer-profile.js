import { buildSafeLawyerProfileResponse } from './safe-lawyer-profile.js';

export const buildSafeAdminLawyerProfileResponse = (profile) => {
  const safeProfile = buildSafeLawyerProfileResponse(profile);
  const populatedUser = profile.user?._id ? profile.user : null;

  return Object.freeze({
    ...safeProfile,
    lawyer: populatedUser
      ? Object.freeze({
          id: populatedUser._id.toString(),
          fullName: populatedUser.fullName,
          email: populatedUser.email,
          role: populatedUser.role,
          isActive: populatedUser.isActive,
        })
      : null,
    reviewedBy: profile.reviewedBy?.toString() || null,
  });
};
