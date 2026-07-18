import { httpClient } from '../../../api/httpClient.js';

export const registerUser = async ({ fullName, email, password, role }) => {
  const response = await httpClient.post('/auth/register', {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
  });

  return response.data;
};
