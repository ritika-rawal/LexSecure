import { httpClient } from '../../../api/httpClient.js';

const getAppointmentDocumentPath = (appointmentId) =>
  `/appointments/${encodeURIComponent(appointmentId)}/documents`;

export const getAppointmentDocuments = async ({
  appointmentId,
  page = 1,
  limit = 10,
  signal,
}) => {
  const response = await httpClient.get(
    getAppointmentDocumentPath(appointmentId),
    {
      params: { page, limit },
      signal,
    },
  );

  return response.data;
};

export const uploadAppointmentDocument = async ({
  appointmentId,
  file,
  onUploadProgress,
}) => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await httpClient.post(
    getAppointmentDocumentPath(appointmentId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      timeout: 30_000,
    },
  );

  return response.data;
};

export const downloadAppointmentDocument = async (documentId) => {
  const response = await httpClient.get(
    `/documents/${encodeURIComponent(documentId)}/download`,
    {
      responseType: 'blob',
      timeout: 30_000,
    },
  );

  return response.data;
};
