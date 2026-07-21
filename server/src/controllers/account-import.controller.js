import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../constants/audit.js';
import { importAccountData as importAccountDataService } from '../services/account-import.service.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import { buildSafeLawyerProfileResponse } from '../utils/safe-lawyer-profile.js';
import { buildSafeUserResponse } from '../utils/safe-user.js';

export const importAccountData = async (req, res) => {
  const result = await importAccountDataService({
    user: req.user,
    importPayload: req.body,
  });
  const isUserImport = result.resourceType === 'user';

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.ACCOUNT_DATA_IMPORTED,
    targetType: isUserImport
      ? AUDIT_TARGET_TYPES.USER
      : AUDIT_TARGET_TYPES.LAWYER_PROFILE,
    targetId: result.resource._id,
  });

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    message: 'Account data imported successfully.',
    data: isUserImport
      ? { user: buildSafeUserResponse(result.resource) }
      : { lawyerProfile: buildSafeLawyerProfileResponse(result.resource) },
  });
};
