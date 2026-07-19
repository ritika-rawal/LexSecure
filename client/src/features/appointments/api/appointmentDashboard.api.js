import { httpClient } from '../../../api/httpClient.js';

export const getMyAppointments = async ({
  status,
  page = 1,
  limit = 10,
  signal,
} = {}) => {
  const response = await httpClient.get('/appointments/me', {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
    signal,
  });

  return response.data;
};

export const cancelAppointment = async ({ appointmentId, reason }) => {
  const response = await httpClient.patch(
    `/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    { reason },
  );

  return response.data;
};
