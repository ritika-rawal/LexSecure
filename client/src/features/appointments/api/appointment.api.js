import { httpClient } from '../../../api/httpClient.js';

export const createAppointment = async (appointmentData) => {
  const response = await httpClient.post('/appointments', appointmentData);
  return response.data;
};
