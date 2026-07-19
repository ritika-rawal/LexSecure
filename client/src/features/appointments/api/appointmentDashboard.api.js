import { httpClient } from '../../../api/httpClient.js';

export const getMyAppointments = async ({
  view = 'upcoming',
  status,
  search,
  fromDate,
  toDate,
  page = 1,
  limit = 10,
  signal,
} = {}) => {
  const from = fromDate
    ? new Date(`${fromDate}T00:00:00.000`).toISOString()
    : undefined;
  const to = toDate
    ? new Date(`${toDate}T23:59:59.999`).toISOString()
    : undefined;
  const response = await httpClient.get('/appointments/me', {
    params: {
      view,
      page,
      limit,
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
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

export const rescheduleAppointment = async ({
  appointmentId,
  appointmentDate,
  startTime,
  endTime,
}) => {
  const response = await httpClient.patch(
    `/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    {
      appointmentDate,
      startTime,
      endTime,
    },
  );

  return response.data;
};
