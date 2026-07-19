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
