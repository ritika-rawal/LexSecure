export const buildSafeIpAccessRuleResponse = (rule) => Object.freeze({
  id: rule.id || rule._id.toString(),
  type: rule.type,
  network: rule.cidr,
  description: rule.description,
  isActive: rule.isActive,
  createdBy: rule.createdBy.toString(),
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});
