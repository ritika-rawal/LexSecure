import { httpClient } from '../../../api/httpClient.js';

export const loginUser = async ({ email, password, captchaToken }) => {
  const response = await httpClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
    ...(captchaToken ? { captchaToken } : {}),
  });

  return response.data;
};
