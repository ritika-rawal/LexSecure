import { httpClient } from '../../../api/httpClient.js';

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await httpClient.patch('/auth/password', {
    currentPassword,
    newPassword,
  });

  return response.data;
};
