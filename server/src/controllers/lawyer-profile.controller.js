import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import {
  createLawyerProfile as createLawyerProfileService,
  getLawyerProfile as getLawyerProfileService,
  updateLawyerProfile as updateLawyerProfileService,
} from '../services/lawyer-profile.service.js';
import { buildSafeLawyerProfileResponse } from '../utils/safe-lawyer-profile.js';

export const createLawyerProfile = async (req, res) => {
  const profile = await createLawyerProfileService({
    lawyerId: req.user.id,
    profileData: req.body,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.LAWYER_PROFILE_CREATED,
    targetType: AUDIT_TARGET_TYPES.LAWYER_PROFILE,
    targetId: profile._id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Lawyer profile created successfully.',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};

export const getCurrentLawyerProfile = async (req, res) => {
  const profile = await getLawyerProfileService(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};

export const updateCurrentLawyerProfile = async (req, res) => {
  const profile = await updateLawyerProfileService({
    lawyerId: req.user.id,
    profileData: req.body,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.LAWYER_PROFILE_UPDATED,
    targetType: AUDIT_TARGET_TYPES.LAWYER_PROFILE,
    targetId: profile._id,
  });

  res.status(200).json({
    status: 'success',
    message: 'Lawyer profile updated successfully.',
    data: {
      profile: buildSafeLawyerProfileResponse(profile),
    },
  });
};
