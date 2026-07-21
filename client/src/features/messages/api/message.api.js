import { httpClient } from '../../../api/httpClient.js';

const getAppointmentMessagePath = (appointmentId) =>
  `/appointments/${encodeURIComponent(appointmentId)}/messages`;

export const getAppointmentMessages = async ({
  appointmentId,
  page = 1,
  limit = 20,
  signal,
}) => {
  const response = await httpClient.get(
    getAppointmentMessagePath(appointmentId),
    {
      params: { page, limit },
      signal,
    },
  );

  return response.data;
};

export const sendAppointmentMessage = async ({
  appointmentId,
  message,
}) => {
  const response = await httpClient.post(
    getAppointmentMessagePath(appointmentId),
    { message },
  );

  return response.data;
};
