import { APPOINTMENT_STATUS } from '../constants/appointment.js';
import { USER_ROLES } from '../constants/user-roles.js';

export const buildSafeAppointmentConfirmation = (appointment) =>
  Object.freeze({
    id: appointment.id,
    lawyerProfileId: appointment.lawyerProfile.toString(),
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    timezone: appointment.timezone,
    consultationType: appointment.consultationType,
    status: appointment.status,
    createdAt: appointment.createdAt,
  });

export const buildSafeLawyerAppointmentResponse = (appointment) =>
  Object.freeze({
    id: appointment.id,
    client: Object.freeze({
      fullName: appointment.client?.fullName || 'Client',
    }),
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    timezone: appointment.timezone,
    consultationType: appointment.consultationType,
    legalIssueSummary: appointment.legalIssueSummary,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  });

export const buildSafeAppointmentDashboardResponse = (
  appointment,
  viewerRole,
) => {
  const participant =
    viewerRole === USER_ROLES.CLIENT ? appointment.lawyer : appointment.client;

  return Object.freeze({
    id: appointment.id,
    participant: Object.freeze({
      fullName: participant?.fullName || 'Account unavailable',
      role:
        viewerRole === USER_ROLES.CLIENT
          ? USER_ROLES.LAWYER
          : USER_ROLES.CLIENT,
    }),
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    timezone: appointment.timezone,
    consultationType: appointment.consultationType,
    legalIssueSummary: appointment.legalIssueSummary,
    cancellation:
      appointment.status === APPOINTMENT_STATUS.CANCELLED
        ? Object.freeze({
            reason: appointment.cancellationReason,
            cancelledByRole: appointment.cancelledByRole,
            cancelledAt: appointment.cancelledAt,
          })
        : null,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  });
};
