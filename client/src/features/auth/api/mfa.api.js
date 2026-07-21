import { httpClient } from '../../../api/httpClient.js';

export const beginMfaSetup = async () => {
  const response = await httpClient.post('/auth/mfa/setup', {});
  return response.data;
};

export const enableMfa = async (code) => {
  const response = await httpClient.post('/auth/mfa/enable', { code });
  return response.data;
};

export const verifyMfaLogin = async (code) => {
  const response = await httpClient.post('/auth/mfa/verify-login', { code });
  return response.data;
};

export const disableMfa = async ({ password, code }) => {
  const response = await httpClient.post('/auth/mfa/disable', {
    password,
    code,
  });
  return response.data;
};
