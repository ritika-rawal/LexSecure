import { httpClient } from '../../../api/httpClient.js';

export const getCurrentLawyerProfile = async ({ signal } = {}) => {
  const response = await httpClient.get('/lawyer-profiles/me', { signal });
  return response.data;
};

export const createLawyerProfile = async (profileData) => {
  const response = await httpClient.post('/lawyer-profiles', profileData);
  return response.data;
};

export const updateCurrentLawyerProfile = async (profileData) => {
  const response = await httpClient.patch('/lawyer-profiles/me', profileData);
  return response.data;
};
