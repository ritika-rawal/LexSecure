import { buildSafeAppointmentDashboardResponse } from './safe-appointment.js';
import { buildSafeLawyerProfileResponse } from './safe-lawyer-profile.js';

const buildSafeExportAccount = (user) =>
  Object.freeze({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

export const buildSafeAccountExport = ({
  user,
  profile,
  appointments,
  exportVersion,
}) =>
  Object.freeze({
    exportVersion,
    generatedAt: new Date().toISOString(),
    account: buildSafeExportAccount(user),
    lawyerProfile: profile
      ? buildSafeLawyerProfileResponse(profile)
      : null,
    appointments: appointments.map((appointment) =>
      buildSafeAppointmentDashboardResponse(appointment, user.role)),
  });
