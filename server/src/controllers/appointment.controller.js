import { createAppointment as createAppointmentService } from '../services/appointment.service.js';
import { buildSafeAppointmentConfirmation } from '../utils/safe-appointment.js';

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
