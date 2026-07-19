import {
  cancelAppointment as cancelAppointmentService,
  createAppointment as createAppointmentService,
  listAppointmentsForUser as listAppointmentsForUserService,
  listPendingLawyerAppointments as listPendingLawyerAppointmentsService,
  rescheduleAppointment as rescheduleAppointmentService,
  reviewAppointment as reviewAppointmentService,
} from '../services/appointment.service.js';
import {
  buildSafeAppointmentConfirmation,
  buildSafeAppointmentDashboardResponse,
  buildSafeLawyerAppointmentResponse,
} from '../utils/safe-appointment.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const createAppointment = async (req, res) => {
  const appointment = await createAppointmentService({
    clientId: req.user.id,
    appointmentData: req.body,
  });

  res.status(201).json({
    status: 'success',
    message: 'Appointment request submitted successfully.',
    data: {
      appointment: buildSafeAppointmentConfirmation(appointment),
    },
  });
};

export const listPendingLawyerAppointments = async (req, res) => {
  const result = await listPendingLawyerAppointmentsService({
    lawyerId: req.user.id,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
  });

  res.status(200).json({
    status: 'success',
    data: {
      appointments: result.appointments.map(buildSafeLawyerAppointmentResponse),
      pagination: result.pagination,
    },
  });
};

export const reviewAppointment = async (req, res) => {
  const appointment = await reviewAppointmentService({
    lawyerId: req.user.id,
    appointmentId: req.params.appointmentId,
    decision: req.body.decision,
  });

  res.status(200).json({
    status: 'success',
    message: `Appointment ${req.body.decision} successfully.`,
    data: {
      appointment: buildSafeLawyerAppointmentResponse(appointment),
    },
  });
};

export const listMyAppointments = async (req, res) => {
  const result = await listAppointmentsForUserService({
    userId: req.user.id,
    userRole: req.user.role,
    status: req.query.status,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
  });

  res.status(200).json({
    status: 'success',
    data: {
      appointments: result.appointments.map((appointment) =>
        buildSafeAppointmentDashboardResponse(appointment, req.user.role)),
      pagination: result.pagination,
    },
  });
};

export const cancelAppointment = async (req, res) => {
  const appointment = await cancelAppointmentService({
    userId: req.user.id,
    userRole: req.user.role,
    appointmentId: req.params.appointmentId,
    reason: req.body.reason,
  });

  res.status(200).json({
    status: 'success',
    message: 'Appointment cancelled successfully.',
    data: {
      appointment: buildSafeAppointmentDashboardResponse(
        appointment,
        req.user.role,
      ),
    },
  });
};

export const rescheduleAppointment = async (req, res) => {
  const appointment = await rescheduleAppointmentService({
    clientId: req.user.id,
    appointmentId: req.params.appointmentId,
    scheduleData: req.body,
  });

  res.status(200).json({
    status: 'success',
    message: 'Appointment rescheduled and returned for lawyer approval.',
    data: {
      appointment: buildSafeAppointmentDashboardResponse(
        appointment,
        req.user.role,
      ),
    },
  });
};
