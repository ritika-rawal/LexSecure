import { httpClient } from '../../../api/httpClient.js';

export const getPublicLawyerProfiles = async ({
  page = 1,
  limit = 12,
  specialization,
  signal,
} = {}) => {
  const response = await httpClient.get('/lawyer-profiles', {
    params: {
      page,
      limit,
      ...(specialization ? { specialization } : {}),
    },
    signal,
  });

  return response.data;
};

export const getPublicLawyerProfile = async ({ profileId, signal }) => {
  const response = await httpClient.get(
    `/lawyer-profiles/${encodeURIComponent(profileId)}`,
    { signal },
  );

  return response.data;
};
