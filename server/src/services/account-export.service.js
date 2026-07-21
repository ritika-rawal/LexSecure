import {
  ACCOUNT_EXPORT_LIMITS,
  ACCOUNT_EXPORT_VERSION,
} from '../constants/account-export.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { Appointment } from '../models/Appointment.model.js';
import { LawyerProfile } from '../models/LawyerProfile.model.js';
import { buildSafeAccountExport } from '../utils/safe-account-export.js';

const EXPORT_ROLE_CONFIGURATION = Object.freeze({
  [USER_ROLES.CLIENT]: Object.freeze({
    ownershipField: 'client',
    participantPath: 'lawyer',
  }),
  [USER_ROLES.LAWYER]: Object.freeze({
    ownershipField: 'lawyer',
    participantPath: 'client',
  }),
});

const createExportTooLargeError = () => {
  const error = new Error(
    'The account contains too many appointments for an immediate export.',
  );
  error.statusCode = 413;
  return error;
};

export const createAccountExport = async (user) => {
  const roleConfiguration = EXPORT_ROLE_CONFIGURATION[user.role];

  if (!roleConfiguration) {
    const error = new Error(
      'This account role cannot export appointment information.',
    );
    error.statusCode = 403;
    throw error;
  }

  const { ownershipField, participantPath } = roleConfiguration;
  const filter = { [ownershipField]: user.id };
  const appointmentCount = await Appointment.countDocuments(filter);

  // Bound in-memory export generation so one account cannot exhaust the API.
  if (appointmentCount > ACCOUNT_EXPORT_LIMITS.MAXIMUM_APPOINTMENTS) {
    throw createExportTooLargeError();
  }

  const [profile, appointments] = await Promise.all([
    user.role === USER_ROLES.LAWYER
      ? LawyerProfile.findOne({ user: user.id })
      : null,
    Appointment.find(filter)
      .select('+legalIssueSummary +cancellationReason +cancelledByRole')
      .sort({ startsAt: -1, _id: -1 })
      .populate(participantPath, 'fullName')
      .exec(),
  ]);

  return buildSafeAccountExport({
    user,
    profile,
    appointments,
    exportVersion: ACCOUNT_EXPORT_VERSION,
  });
};
