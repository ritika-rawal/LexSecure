import { httpClient } from '../../../api/httpClient.js';

export const getPendingLawyerProfiles = async ({ page = 1, limit = 10, signal } = {}) => {
  const response = await httpClient.get('/admin/lawyer-profiles', {
    params: {
      status: 'pending',
      page,
      limit,
    },
    signal,
  });

  return response.data;
};

export const submitLawyerProfileReview = async ({ profileId, decision }) => {
  const response = await httpClient.patch(
    `/admin/lawyer-profiles/${encodeURIComponent(profileId)}/review`,
    { decision },
  );

  return response.data;
};
