import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../constants/audit.js';
import {
  createIpAccessRule as createIpAccessRuleService,
  deleteIpAccessRule as deleteIpAccessRuleService,
  listIpAccessRules as listIpAccessRulesService,
  setIpAccessRuleStatus,
} from '../services/admin-ip-access.service.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import { buildSafeIpAccessRuleResponse } from '../utils/safe-ip-access-rule.js';

export const listIpAccessRules = async (req, res) => {
  const rules = await listIpAccessRulesService();

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    data: {
      rules: rules.map(buildSafeIpAccessRuleResponse),
      sourceIp: req.ip,
    },
  });
};

export const createIpAccessRule = async (req, res) => {
  const rule = await createIpAccessRuleService({
    ...req.body,
    description: req.body.description || '',
    isActive: req.body.isActive ?? true,
    adminId: req.user.id,
    sourceIp: req.ip,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.IP_ACCESS_RULE_CREATED,
    targetType: AUDIT_TARGET_TYPES.IP_ACCESS_RULE,
    targetId: rule._id,
  });

  res.status(201).json({
    status: 'success',
    message: 'IP access rule created successfully.',
    data: { rule: buildSafeIpAccessRuleResponse(rule) },
  });
};

export const updateIpAccessRule = async (req, res) => {
  const rule = await setIpAccessRuleStatus({
    ruleId: req.params.ruleId,
    isActive: req.body.isActive,
    sourceIp: req.ip,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.IP_ACCESS_RULE_UPDATED,
    targetType: AUDIT_TARGET_TYPES.IP_ACCESS_RULE,
    targetId: rule._id,
  });

  res.status(200).json({
    status: 'success',
    message: `IP access rule ${rule.isActive ? 'enabled' : 'disabled'} successfully.`,
    data: { rule: buildSafeIpAccessRuleResponse(rule) },
  });
};

export const deleteIpAccessRule = async (req, res) => {
  const rule = await deleteIpAccessRuleService({
    ruleId: req.params.ruleId,
    sourceIp: req.ip,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.IP_ACCESS_RULE_DELETED,
    targetType: AUDIT_TARGET_TYPES.IP_ACCESS_RULE,
    targetId: rule._id,
  });

  res.status(204).send();
};
