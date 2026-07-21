import { httpClient } from '../../../api/httpClient.js';

export const downloadAccountExport = async () => {
  const response = await httpClient.get('/account/export', {
    responseType: 'blob',
    timeout: 30_000,
  });

  return response.data;
};
