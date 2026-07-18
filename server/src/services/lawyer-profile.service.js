import { LawyerProfile } from '../models/LawyerProfile.model.js';

const createDuplicateProfileError = () => {
  const error = new Error('A lawyer profile already exists for this account.');
  error.statusCode = 409;
  return error;
};

const createProfileNotFoundError = () => {
  const error = new Error('Lawyer profile not found.');
  error.statusCode = 404;
  return error;
};

const UPDATABLE_PROFILE_FIELDS = Object.freeze([
  'professionalTitle',
  'biography',
  'specializations',
  'yearsOfExperience',
  'consultationFee',
  'timezone',
  'weeklyAvailability',
]);

export const createLawyerProfile = async ({ lawyerId, profileData }) => {
  const existingProfile = await LawyerProfile.exists({ user: lawyerId });

  if (existingProfile) {
    throw createDuplicateProfileError();
  }

  const {
    professionalTitle,
    biography,
    specializations,
    yearsOfExperience,
    consultationFee,
    timezone,
    weeklyAvailability,
  } = profileData;

  try {
    return await LawyerProfile.create({
      user: lawyerId,
      professionalTitle,
      biography,
      specializations,
      yearsOfExperience,
      consultationFee,
      timezone,
      weeklyAvailability,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createDuplicateProfileError();
    }

    throw error;
  }
};

export const getLawyerProfile = async (lawyerId) => {
  const profile = await LawyerProfile.findOne({ user: lawyerId });

  if (!profile) {
    throw createProfileNotFoundError();
  }

  return profile;
};

export const updateLawyerProfile = async ({ lawyerId, profileData }) => {
  const profile = await LawyerProfile.findOne({ user: lawyerId });

  if (!profile) {
    throw createProfileNotFoundError();
  }

  for (const field of UPDATABLE_PROFILE_FIELDS) {
    if (Object.hasOwn(profileData, field)) {
      profile.set(field, profileData[field]);
    }
  }

  await profile.save();
  return profile;
};
