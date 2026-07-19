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
