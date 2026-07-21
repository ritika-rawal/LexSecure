import { httpClient } from '../../../api/httpClient.js';

export const importAccountData = async (payload) => {
  const response = await httpClient.post('/account/import', payload);
  return response.data;
};
