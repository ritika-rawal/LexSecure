import { httpClient } from '../../../api/httpClient.js';

export const getCurrentUser = async ({ signal } = {}) => {
  const response = await httpClient.get('/auth/me', { signal });

  return response.data;
};
