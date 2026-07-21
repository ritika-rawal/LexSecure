import { isIP } from 'node:net';

import { IP_ACCESS_POLICY_CACHE_MS, IP_ACCESS_RULE_TYPES } from '../constants/ip-access.js';
import { IpAccessRule } from '../models/IpAccessRule.model.js';
import { createNetworkMatcher } from '../utils/ip-network.js';

let cachedPolicy = null;

export const invalidateIpAccessPolicyCache = () => {
  cachedPolicy = null;
};

const loadActivePolicy = async () => {
  if (cachedPolicy && cachedPolicy.expiresAt > Date.now()) return cachedPolicy;

  const rules = await IpAccessRule.find({ isActive: true })
    .select('+address +prefixLength +family')
    .lean();
  const allowRules = rules.filter(({ type }) => type === IP_ACCESS_RULE_TYPES.ALLOW);
  const blockRules = rules.filter(({ type }) => type === IP_ACCESS_RULE_TYPES.BLOCK);

  cachedPolicy = {
    expiresAt: Date.now() + IP_ACCESS_POLICY_CACHE_MS,
    hasAllowRules: allowRules.length > 0,
    matchesAllowRule: createNetworkMatcher(allowRules),
    matchesBlockRule: createNetworkMatcher(blockRules),
  };

  return cachedPolicy;
};

export const evaluateIpAccess = async (ipAddress) => {
  if (!isIP(ipAddress)) {
    return Object.freeze({ allowed: false, reason: 'invalid_source' });
  }

  const policy = await loadActivePolicy();

  if (policy.matchesBlockRule(ipAddress)) {
    return Object.freeze({ allowed: false, reason: 'block_rule' });
  }

  if (policy.hasAllowRules && !policy.matchesAllowRule(ipAddress)) {
    return Object.freeze({ allowed: false, reason: 'allowlist_miss' });
  }

  return Object.freeze({ allowed: true, reason: null });
};
