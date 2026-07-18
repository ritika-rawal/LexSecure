import { httpClient } from '../../../api/httpClient.js';

export const loginUser = async ({ email, password }) => {
  const response = await httpClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });

  return response.data;
};
