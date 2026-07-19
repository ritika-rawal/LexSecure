import { httpClient } from '../../../api/httpClient.js';

export const getNotifications = async ({
  page = 1,
  limit = 8,
  unreadOnly = false,
  signal,
} = {}) => {
  const response = await httpClient.get('/notifications', {
    params: {
      page,
      limit,
      ...(unreadOnly ? { unreadOnly: true } : {}),
    },
    signal,
  });

  return response.data;
};

export const getUnreadNotificationCount = async ({ signal } = {}) => {
  const response = await httpClient.get('/notifications/unread-count', {
    signal,
  });

  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await httpClient.patch(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );

  return response.data;
};
