import { httpClient } from '../../../api/httpClient.js';

export const getIpAccessRules = async ({ signal } = {}) => {
  const response = await httpClient.get('/admin/ip-access-rules', { signal });
  return response.data;
};

export const createIpAccessRule = async (rule) => {
  const response = await httpClient.post('/admin/ip-access-rules', rule);
  return response.data;
};

export const updateIpAccessRuleStatus = async ({ ruleId, isActive }) => {
  const response = await httpClient.patch(`/admin/ip-access-rules/${ruleId}`, {
    isActive,
  });
  return response.data;
};

export const deleteIpAccessRule = async (ruleId) => {
  await httpClient.delete(`/admin/ip-access-rules/${ruleId}`);
};
