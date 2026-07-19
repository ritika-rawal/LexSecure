import { LAWYER_APPROVAL_STATUS } from '../constants/lawyer-profile.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { APPOINTMENT_DURATION_LIMITS_MS } from '../constants/appointment.js';
import { Appointment } from '../models/Appointment.model.js';
import { LawyerProfile } from '../models/LawyerProfile.model.js';
import {
  buildReservedTimeBlocks,
  getWeekDayForLocalDate,
  localDateTimeToUtc,
} from '../utils/timezone.js';

const MAXIMUM_ADVANCE_BOOKING_MS = 365 * 24 * 60 * 60 * 1000;

const createUnavailableProfileError = () => {
  const error = new Error('Lawyer profile is not available for booking.');
  error.statusCode = 404;
  return error;
};

const createInvalidSlotError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const createConflictError = () => {
  const error = new Error('The selected appointment time is no longer available.');
  error.statusCode = 409;
  return error;
};

export const createAppointment = async ({ clientId, appointmentData }) => {
  const profile = await LawyerProfile.findOne({
    _id: appointmentData.lawyerProfileId,
    approvalStatus: LAWYER_APPROVAL_STATUS.APPROVED,
    isVisible: true,
  }).populate({
    path: 'user',
    match: {
      role: USER_ROLES.LAWYER,
      isActive: true,
    },
    select: '_id',
  });

  if (!profile || !profile.user) {
    throw createUnavailableProfileError();
  }

  const dayOfWeek = getWeekDayForLocalDate(appointmentData.appointmentDate);
  const selectedSlot = profile.weeklyAvailability.find(
    (slot) =>
      slot.dayOfWeek === dayOfWeek
      && slot.startTime === appointmentData.startTime
      && slot.endTime === appointmentData.endTime,
  );

  if (!selectedSlot) {
    throw createInvalidSlotError(
      'Selected time must exactly match the lawyer availability for that day.',
    );
  }

  let startsAt;
  let endsAt;

  try {
    startsAt = localDateTimeToUtc({
      dateValue: appointmentData.appointmentDate,
      timeValue: selectedSlot.startTime,
      timezone: profile.timezone,
    });
    endsAt = localDateTimeToUtc({
      dateValue: appointmentData.appointmentDate,
      timeValue: selectedSlot.endTime,
      timezone: profile.timezone,
    });
  } catch (error) {
    if (error instanceof RangeError) {
      throw createInvalidSlotError(error.message);
    }

    throw error;
  }

  const now = Date.now();

  if (startsAt.getTime() <= now) {
    throw createInvalidSlotError('Appointment start time must be in the future.');
  }

  if (startsAt.getTime() > now + MAXIMUM_ADVANCE_BOOKING_MS) {
    throw createInvalidSlotError('Appointments cannot be booked more than one year ahead.');
  }

  const duration = endsAt.getTime() - startsAt.getTime();

  if (
    duration < APPOINTMENT_DURATION_LIMITS_MS.MINIMUM
    || duration > APPOINTMENT_DURATION_LIMITS_MS.MAXIMUM
  ) {
    throw createInvalidSlotError(
      'Appointment duration must be between 15 minutes and 4 hours.',
    );
  }

  const reservedTimeBlocks = buildReservedTimeBlocks(startsAt, endsAt);
  const conflictingAppointment = await Appointment.exists({
    isSlotReserved: true,
    reservedTimeBlocks: { $in: reservedTimeBlocks },
    $or: [
      { lawyer: profile.user._id },
      { client: clientId },
    ],
  });

  if (conflictingAppointment) {
    throw createConflictError();
  }

  try {
    return await Appointment.create({
      client: clientId,
      lawyer: profile.user._id,
      lawyerProfile: profile._id,
      startsAt,
      endsAt,
      timezone: profile.timezone,
      consultationType: appointmentData.consultationType,
      legalIssueSummary: appointmentData.legalIssueSummary,
      reservedTimeBlocks,
      isSlotReserved: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createConflictError();
    }

    throw error;
  }
};
