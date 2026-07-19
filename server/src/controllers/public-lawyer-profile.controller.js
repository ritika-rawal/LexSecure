import {
  getPublicLawyerProfile as getPublicLawyerProfileService,
  listPublicLawyerProfiles as listPublicLawyerProfilesService,
} from '../services/public-lawyer-profile.service.js';
import { buildSafePublicLawyerProfileResponse } from '../utils/safe-public-lawyer-profile.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

export const listPublicLawyerProfiles = async (req, res) => {
  const result = await listPublicLawyerProfilesService({
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
    specialization: req.query.specialization,
  });

  res.status(200).json({
    status: 'success',
    data: {
      profiles: result.profiles.map(buildSafePublicLawyerProfileResponse),
      pagination: result.pagination,
    },
  });
};

export const getPublicLawyerProfile = async (req, res) => {
  const profile = await getPublicLawyerProfileService(req.params.profileId);

  res.status(200).json({
    status: 'success',
    data: {
      profile: buildSafePublicLawyerProfileResponse(profile),
    },
  });
};
