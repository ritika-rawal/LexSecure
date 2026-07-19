import { httpClient } from '../../../api/httpClient.js';

export const getPendingLawyerAppointments = async ({
  page = 1,
  limit = 10,
  signal,
} = {}) => {
  const response = await httpClient.get('/appointments/lawyer', {
    params: { page, limit },
    signal,
  });

  return response.data;
};

export const submitAppointmentDecision = async ({ appointmentId, decision }) => {
  const response = await httpClient.patch(
    `/appointments/${encodeURIComponent(appointmentId)}/decision`,
    { decision },
  );

  return response.data;
};
