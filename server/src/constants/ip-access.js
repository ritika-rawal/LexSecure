export const IP_ACCESS_RULE_TYPES = Object.freeze({
  ALLOW: 'allow',
  BLOCK: 'block',
});

export const IP_ACCESS_RULE_TYPE_VALUES = Object.freeze(
  Object.values(IP_ACCESS_RULE_TYPES),
);

export const IP_ACCESS_ERROR_CODE = 'IP_ACCESS_DENIED';
export const IP_ACCESS_POLICY_CACHE_MS = 5_000;
