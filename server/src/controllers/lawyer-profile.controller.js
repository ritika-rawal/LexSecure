import {
  createLawyerProfile as createLawyerProfileService,
  getLawyerProfile as getLawyerProfileService,
  updateLawyerProfile as updateLawyerProfileService,
} from '../services/lawyer-profile.service.js';
import { buildSafeLawyerProfileResponse } from '../utils/safe-lawyer-profile.js';

export const createLawyerProfile = async (req, res) => {
  const profile = await createLawyerProfileService({
    lawyerId: req.user.id,
    profileData: req.body,
  });

  res.status(201).json({
    status: 'success',
    message: 'Lawyer profile created successfully.',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};

export const getCurrentLawyerProfile = async (req, res) => {
  const profile = await getLawyerProfileService(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};

export const updateCurrentLawyerProfile = async (req, res) => {
  const profile = await updateLawyerProfileService({
    lawyerId: req.user.id,
    profileData: req.body,
  });

  res.status(200).json({
    status: 'success',
    message: 'Lawyer profile updated successfully.',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};
