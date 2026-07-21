import { httpClient } from '../../../api/httpClient.js';

export const requestPasswordReset = async (email) => {
  const response = await httpClient.post('/auth/password-reset/request', {
    email: email.trim().toLowerCase(),
  });
  return response.data;
};

export const confirmPasswordReset = async ({ token, password }) => {
  const response = await httpClient.post('/auth/password-reset/confirm', {
    token,
    password,
  });
  return response.data;
};
