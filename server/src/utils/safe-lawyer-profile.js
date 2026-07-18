export const buildSafeLawyerProfileResponse = (profile) =>
  Object.freeze({
    id: profile.id,
    userId: profile.user.toString(),
    professionalTitle: profile.professionalTitle,
    biography: profile.biography,
    specializations: profile.specializations,
    yearsOfExperience: profile.yearsOfExperience,
    consultationFee: profile.consultationFee,
    timezone: profile.timezone,
    weeklyAvailability: profile.weeklyAvailability,
    isVisible: profile.isVisible,
    approvalStatus: profile.approvalStatus,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
