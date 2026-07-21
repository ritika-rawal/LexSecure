import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { IP_ACCESS_ERROR_CODE } from '../constants/ip-access.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import { evaluateIpAccess } from '../services/ip-access-policy.service.js';

export const enforceIpAccessPolicy = async (req, res, next) => {
  const access = await evaluateIpAccess(req.ip);

  if (access.allowed) {
    next();
    return;
  }

  await recordAuditEventWithoutBlocking({
    req,
    actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
    action: AUDIT_ACTIONS.IP_ACCESS_DENIED,
    outcome: AUDIT_OUTCOMES.FAILURE,
    targetType: AUDIT_TARGET_TYPES.IP_ACCESS_RULE,
    subject: access.reason,
  });

  res.set('Cache-Control', 'private, no-store');
  res.status(403).json({
    status: 'error',
    code: IP_ACCESS_ERROR_CODE,
    message: 'Access from this network is not permitted.',
  });
};
