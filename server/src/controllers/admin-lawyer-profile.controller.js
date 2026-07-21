import { LAWYER_APPROVAL_STATUS } from '../constants/lawyer-profile.js';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import {
  listLawyerProfilesForReview as listLawyerProfilesForReviewService,
  reviewLawyerProfile as reviewLawyerProfileService,
} from '../services/admin-lawyer-profile.service.js';
import { buildSafeAdminLawyerProfileResponse } from '../utils/safe-admin-lawyer-profile.js';

export const listLawyerProfilesForReview = async (req, res) => {
  const result = await listLawyerProfilesForReviewService({
    status: req.query.status || LAWYER_APPROVAL_STATUS.PENDING,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  });

  res.status(200).json({
    status: 'success',
    data: {
      profiles: result.profiles.map(buildSafeAdminLawyerProfileResponse),
      pagination: result.pagination,
    },
  });
};

export const reviewLawyerProfile = async (req, res) => {
  const profile = await reviewLawyerProfileService({
    profileId: req.params.profileId,
    adminId: req.user.id,
    decision: req.body.decision,
  });

  await recordAuthenticatedAuditEvent(req, {
    action:
      req.body.decision === LAWYER_APPROVAL_STATUS.APPROVED
        ? AUDIT_ACTIONS.LAWYER_PROFILE_APPROVED
        : AUDIT_ACTIONS.LAWYER_PROFILE_REJECTED,
    targetType: AUDIT_TARGET_TYPES.LAWYER_PROFILE,
    targetId: profile._id,
  });

  res.status(200).json({
    status: 'success',
    message: `Lawyer profile ${req.body.decision} successfully.`,
    data: {
      profile: buildSafeAdminLawyerProfileResponse(profile),
    },
  });
};
