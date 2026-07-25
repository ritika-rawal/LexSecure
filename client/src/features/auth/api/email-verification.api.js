import { httpClient } from '../../../api/httpClient.js';

export const confirmEmailVerification = async (token) => {
  const response = await httpClient.post('/auth/verify-email', { token });
  return response.data;
};
