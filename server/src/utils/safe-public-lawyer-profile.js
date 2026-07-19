export const buildSafePublicLawyerProfileResponse = (profile) =>
  Object.freeze({
    id: profile._id.toString(),
    lawyer: Object.freeze({
      fullName: profile.lawyer.fullName,
    }),
    professionalTitle: profile.professionalTitle,
    biography: profile.biography,
    specializations: profile.specializations,
    yearsOfExperience: profile.yearsOfExperience,
    consultationFee: profile.consultationFee,
    timezone: profile.timezone,
    weeklyAvailability: profile.weeklyAvailability,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
