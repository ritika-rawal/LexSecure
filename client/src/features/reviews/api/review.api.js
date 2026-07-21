import { httpClient } from '../../../api/httpClient.js';

const getAppointmentReviewPath = (appointmentId) =>
  `/appointments/${encodeURIComponent(appointmentId)}/review`;

export const getAppointmentReview = async ({ appointmentId, signal }) => {
  const response = await httpClient.get(
    getAppointmentReviewPath(appointmentId),
    { signal },
  );

  return response.data;
};

export const createAppointmentReview = async ({
  appointmentId,
  rating,
  comment,
}) => {
  const response = await httpClient.post(
    getAppointmentReviewPath(appointmentId),
    {
      rating,
      ...(comment ? { comment } : {}),
    },
  );

  return response.data;
};

export const getPublicLawyerReviews = async ({
  profileId,
  page = 1,
  limit = 5,
  signal,
}) => {
  const response = await httpClient.get(
    `/lawyer-profiles/${encodeURIComponent(profileId)}/reviews`,
    {
      params: { page, limit },
      signal,
    },
  );

  return response.data;
};
