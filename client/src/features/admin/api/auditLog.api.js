import { httpClient } from '../../../api/httpClient.js';

const toIsoTimestamp = (value) =>
  value ? new Date(value).toISOString() : undefined;

export const getAuditLogs = async ({
  action,
  outcome,
  actorRole,
  targetType,
  requestId,
  targetId,
  from,
  to,
  page = 1,
  limit = 25,
  signal,
} = {}) => {
  const response = await httpClient.get('/admin/audit-logs', {
    params: {
      page,
      limit,
      ...(action ? { action } : {}),
      ...(outcome ? { outcome } : {}),
      ...(actorRole ? { actorRole } : {}),
      ...(targetType ? { targetType } : {}),
      ...(requestId ? { requestId } : {}),
      ...(targetId ? { targetId } : {}),
      ...(from ? { from: toIsoTimestamp(from) } : {}),
      ...(to ? { to: toIsoTimestamp(to) } : {}),
    },
    signal,
  });

  return response.data;
};
