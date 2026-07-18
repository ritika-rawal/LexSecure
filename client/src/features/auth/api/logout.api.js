import { httpClient } from '../../../api/httpClient.js';

export const logoutUser = async () => {
  await httpClient.post('/auth/logout');
};
