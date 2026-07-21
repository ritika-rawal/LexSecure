import { IP_ACCESS_RULE_TYPES } from '../constants/ip-access.js';
import { IpAccessRule } from '../models/IpAccessRule.model.js';
import { createNetworkMatcher, parseIpNetwork } from '../utils/ip-network.js';
import { invalidateIpAccessPolicyCache } from './ip-access-policy.service.js';

const createRuleNotFoundError = () => {
  const error = new Error('IP access rule not found.');
  error.statusCode = 404;
  return error;
};

const createSelfLockoutError = () => {
  const error = new Error('This change would remove access for your current IP address.');
  error.statusCode = 409;
  error.publicCode = 'IP_RULE_SELF_LOCKOUT';
  return error;
};

const ruleMatchesAddress = (rule, ipAddress) => createNetworkMatcher([rule])(ipAddress);

const getActiveAllowRules = (excludedRuleId = null) => {
  const filter = {
    type: IP_ACCESS_RULE_TYPES.ALLOW,
    isActive: true,
  };

  if (excludedRuleId) filter._id = { $ne: excludedRuleId };

  return IpAccessRule.find(filter)
    .select('+address +prefixLength +family')
    .lean();
};

const assertAllowlistChangeKeepsCurrentAccess = async ({
  candidateRule = null,
  excludedRuleId = null,
  sourceIp,
}) => {
  const remainingRules = await getActiveAllowRules(excludedRuleId);
  const effectiveRules = candidateRule
    ? [...remainingRules, candidateRule]
    : remainingRules;

  // No allow rules means allowlist mode is disabled and access remains open.
  if (effectiveRules.length > 0 && !createNetworkMatcher(effectiveRules)(sourceIp)) {
    throw createSelfLockoutError();
  }
};

export const listIpAccessRules = () =>
  IpAccessRule.find()
    .sort({ isActive: -1, type: 1, createdAt: -1 })
    .lean();

export const createIpAccessRule = async ({
  type,
  network,
  description,
  isActive,
  adminId,
  sourceIp,
}) => {
  const parsedNetwork = parseIpNetwork(network);
  const candidateRule = { ...parsedNetwork, type, isActive };

  if (isActive && type === IP_ACCESS_RULE_TYPES.BLOCK && ruleMatchesAddress(candidateRule, sourceIp)) {
    throw createSelfLockoutError();
  }

  if (isActive && type === IP_ACCESS_RULE_TYPES.ALLOW) {
    await assertAllowlistChangeKeepsCurrentAccess({ candidateRule, sourceIp });
  }

  try {
    const rule = await IpAccessRule.create({
      ...candidateRule,
      description,
      createdBy: adminId,
    });
    invalidateIpAccessPolicyCache();
    return rule;
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error('A rule already exists for this network.');
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

export const setIpAccessRuleStatus = async ({ ruleId, isActive, sourceIp }) => {
  const rule = await IpAccessRule.findById(ruleId)
    .select('+address +prefixLength +family');

  if (!rule) throw createRuleNotFoundError();
  if (rule.isActive === isActive) return rule;

  if (
    isActive
    && rule.type === IP_ACCESS_RULE_TYPES.BLOCK
    && ruleMatchesAddress(rule, sourceIp)
  ) {
    throw createSelfLockoutError();
  }

  if (rule.type === IP_ACCESS_RULE_TYPES.ALLOW) {
    await assertAllowlistChangeKeepsCurrentAccess({
      candidateRule: isActive ? rule : null,
      excludedRuleId: rule._id,
      sourceIp,
    });
  }

  rule.set('isActive', isActive);
  await rule.save();
  invalidateIpAccessPolicyCache();
  return rule;
};

export const deleteIpAccessRule = async ({ ruleId, sourceIp }) => {
  const rule = await IpAccessRule.findById(ruleId)
    .select('+address +prefixLength +family');

  if (!rule) throw createRuleNotFoundError();

  if (rule.isActive && rule.type === IP_ACCESS_RULE_TYPES.ALLOW) {
    await assertAllowlistChangeKeepsCurrentAccess({
      excludedRuleId: rule._id,
      sourceIp,
    });
  }

  await rule.deleteOne();
  invalidateIpAccessPolicyCache();
  return rule;
};
