import { LAWYER_APPROVAL_STATUS } from '../constants/lawyer-profile.js';
import { USER_ROLES } from '../constants/user-roles.js';
import {
  APPOINTMENT_DURATION_LIMITS_MS,
  APPOINTMENT_STATUS,
} from '../constants/appointment.js';
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

const resolveAppointmentSlot = ({
  profile,
  appointmentDate,
  startTime,
  endTime,
}) => {
  const dayOfWeek = getWeekDayForLocalDate(appointmentDate);
  const selectedSlot = profile.weeklyAvailability.find(
    (slot) =>
      slot.dayOfWeek === dayOfWeek
      && slot.startTime === startTime
      && slot.endTime === endTime,
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
      dateValue: appointmentDate,
      timeValue: selectedSlot.startTime,
      timezone: profile.timezone,
    });
    endsAt = localDateTimeToUtc({
      dateValue: appointmentDate,
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
    throw createInvalidSlotError(
      'Appointments cannot be booked more than one year ahead.',
    );
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

  return {
    startsAt,
    endsAt,
    reservedTimeBlocks: buildReservedTimeBlocks(startsAt, endsAt),
  };
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

  const { startsAt, endsAt, reservedTimeBlocks } = resolveAppointmentSlot({
    profile,
    appointmentDate: appointmentData.appointmentDate,
    startTime: appointmentData.startTime,
    endTime: appointmentData.endTime,
  });
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

const createAppointmentNotFoundError = () => {
  const error = new Error('Appointment not found.');
  error.statusCode = 404;
  return error;
};

const createInvalidDecisionError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

export const listPendingLawyerAppointments = async ({ lawyerId, page, limit }) => {
  const filter = {
    lawyer: lawyerId,
    status: APPOINTMENT_STATUS.PENDING,
  };
  const skip = (page - 1) * limit;
  const [appointments, totalItems] = await Promise.all([
    Appointment.find(filter)
      .select('+legalIssueSummary')
      .sort({ startsAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('client', 'fullName')
      .exec(),
    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const cancelAppointment = async ({
  userId,
  userRole,
  appointmentId,
  reason,
}) => {
  const ownershipField =
    userRole === USER_ROLES.CLIENT ? 'client' : 'lawyer';
  const participantPath =
    userRole === USER_ROLES.CLIENT ? 'lawyer' : 'client';
  const allowedStatuses =
    userRole === USER_ROLES.CLIENT
      ? [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED]
      : [APPOINTMENT_STATUS.APPROVED];
  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: appointmentId,
      [ownershipField]: userId,
      status: { $in: allowedStatuses },
      startsAt: { $gt: new Date() },
    },
    {
      $set: {
        status: APPOINTMENT_STATUS.CANCELLED,
        cancellationReason: reason,
        cancelledByRole: userRole,
        cancelledAt: new Date(),
        isSlotReserved: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select('+legalIssueSummary +cancellationReason +cancelledByRole')
    .populate(participantPath, 'fullName')
    .exec();

  if (appointment) {
    return appointment;
  }

  const existingAppointment = await Appointment.findOne({
    _id: appointmentId,
    [ownershipField]: userId,
  }).select('status startsAt');

  if (!existingAppointment) {
    throw createAppointmentNotFoundError();
  }

  if (existingAppointment.startsAt.getTime() <= Date.now()) {
    throw createInvalidDecisionError('Past appointments cannot be cancelled.');
  }

  if (
    userRole === USER_ROLES.LAWYER
    && existingAppointment.status === APPOINTMENT_STATUS.PENDING
  ) {
    throw createInvalidDecisionError(
      'Pending requests must be rejected from the appointment inbox.',
    );
  }

  throw createInvalidDecisionError('This appointment cannot be cancelled.');
};

export const rescheduleAppointment = async ({
  clientId,
  appointmentId,
  scheduleData,
}) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    client: clientId,
  }).select('lawyer lawyerProfile startsAt endsAt status');

  if (!appointment) {
    throw createAppointmentNotFoundError();
  }

  if (
    ![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(
      appointment.status,
    )
  ) {
    throw createInvalidDecisionError(
      'Only pending or approved appointments can be rescheduled.',
    );
  }

  if (appointment.startsAt.getTime() <= Date.now()) {
    throw createInvalidDecisionError('Past appointments cannot be rescheduled.');
  }

  const profile = await LawyerProfile.findOne({
    _id: appointment.lawyerProfile,
    user: appointment.lawyer,
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

  const { startsAt, endsAt, reservedTimeBlocks } = resolveAppointmentSlot({
    profile,
    appointmentDate: scheduleData.appointmentDate,
    startTime: scheduleData.startTime,
    endTime: scheduleData.endTime,
  });

  if (
    startsAt.getTime() === appointment.startsAt.getTime()
    && endsAt.getTime() === appointment.endsAt.getTime()
  ) {
    throw createInvalidSlotError(
      'Select a different time when rescheduling an appointment.',
    );
  }

  const conflictingAppointment = await Appointment.exists({
    _id: { $ne: appointment._id },
    isSlotReserved: true,
    reservedTimeBlocks: { $in: reservedTimeBlocks },
    $or: [
      { lawyer: appointment.lawyer },
      { client: clientId },
    ],
  });

  if (conflictingAppointment) {
    throw createConflictError();
  }

  try {
    const updatedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: appointment._id,
        client: clientId,
        status: {
          $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED],
        },
        startsAt: appointment.startsAt,
      },
      {
        $set: {
          startsAt,
          endsAt,
          timezone: profile.timezone,
          reservedTimeBlocks,
          isSlotReserved: true,
          status: APPOINTMENT_STATUS.PENDING,
          rescheduledAt: new Date(),
        },
        $inc: {
          rescheduleCount: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .select('+legalIssueSummary')
      .populate('lawyer', 'fullName')
      .exec();

    if (!updatedAppointment) {
      throw createInvalidDecisionError(
        'The appointment changed before rescheduling. Refresh and try again.',
      );
    }

    return updatedAppointment;
  } catch (error) {
    if (error.code === 11000) {
      throw createConflictError();
    }

    throw error;
  }
};

export const reviewAppointment = async ({ lawyerId, appointmentId, decision }) => {
  const update = {
    $set: {
      status: decision,
      ...(decision === APPOINTMENT_STATUS.REJECTED
        ? { isSlotReserved: false }
        : {}),
    },
  };
  const filter = {
    _id: appointmentId,
    lawyer: lawyerId,
    status: APPOINTMENT_STATUS.PENDING,
    ...(decision === APPOINTMENT_STATUS.APPROVED
      ? { startsAt: { $gt: new Date() } }
      : {}),
  };
  const appointment = await Appointment.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true,
  })
    .select('+legalIssueSummary')
    .populate('client', 'fullName')
    .exec();

  if (appointment) {
    return appointment;
  }

  const existingAppointment = await Appointment.findOne({
    _id: appointmentId,
    lawyer: lawyerId,
  }).select('status startsAt');

  if (!existingAppointment) {
    throw createAppointmentNotFoundError();
  }

  if (existingAppointment.status !== APPOINTMENT_STATUS.PENDING) {
    throw createInvalidDecisionError('Only pending appointments can be reviewed.');
  }

  throw createInvalidDecisionError('Past appointments cannot be approved.');
};

export const listAppointmentsForUser = async ({
  userId,
  userRole,
  status,
  page,
  limit,
}) => {
  const ownershipField =
    userRole === USER_ROLES.CLIENT ? 'client' : 'lawyer';
  const participantPath =
    userRole === USER_ROLES.CLIENT ? 'lawyer' : 'client';
  const filter = {
    [ownershipField]: userId,
    ...(status ? { status } : {}),
  };
  const skip = (page - 1) * limit;
  const [appointments, totalItems] = await Promise.all([
    Appointment.find(filter)
      .select('+legalIssueSummary +cancellationReason +cancelledByRole')
      .sort({ startsAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(participantPath, 'fullName')
      .exec(),
    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
