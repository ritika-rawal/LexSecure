import { APPOINTMENT_STATUS } from '../constants/appointment.js';
import { Appointment } from '../models/Appointment.model.js';
import { Message } from '../models/Message.model.js';
import {
  decryptMessage,
  encryptMessage,
} from '../utils/message-crypto.js';
import { buildSafeMessageResponse } from '../utils/safe-message.js';

const createConversationNotFoundError = () => {
  const error = new Error('Appointment conversation not found.');
  error.statusCode = 404;
  return error;
};

const createMessagingUnavailableError = () => {
  const error = new Error(
    'Messaging is available only for approved appointments.',
  );
  error.statusCode = 409;
  return error;
};

const findParticipantAppointment = async ({
  appointmentId,
  userId,
  status,
}) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    ...(status ? { status } : {}),
    $or: [
      { client: userId },
      { lawyer: userId },
    ],
  }).select('client lawyer status');

  if (!appointment) {
    throw createConversationNotFoundError();
  }

  return appointment;
};

const getRecipientId = (appointment, senderId) => {
  const normalizedSenderId = senderId.toString();

  if (appointment.client.toString() === normalizedSenderId) {
    return appointment.lawyer;
  }

  return appointment.client;
};

const decryptMessageBody = (message) =>
  decryptMessage({
    encryptedBody: message.encryptedBody,
    encryptionIv: message.encryptionIv,
    encryptionAuthTag: message.encryptionAuthTag,
    appointmentId: message.appointment,
    senderId: message.sender,
    recipientId: message.recipient,
  });

export const sendAppointmentMessage = async ({
  appointmentId,
  senderId,
  body,
}) => {
  let appointment;

  try {
    appointment = await findParticipantAppointment({
      appointmentId,
      userId: senderId,
      status: APPOINTMENT_STATUS.APPROVED,
    });
  } catch (error) {
    if (error.statusCode !== 404) throw error;

    const participantAppointment = await Appointment.exists({
      _id: appointmentId,
      $or: [
        { client: senderId },
        { lawyer: senderId },
      ],
    });

    if (participantAppointment) {
      throw createMessagingUnavailableError();
    }

    throw error;
  }

  const recipientId = getRecipientId(appointment, senderId);
  const encryptionMetadata = encryptMessage({
    message: body,
    appointmentId: appointment._id,
    senderId,
    recipientId,
  });
  const message = await Message.create({
    appointment: appointment._id,
    sender: senderId,
    recipient: recipientId,
    ...encryptionMetadata,
    bodyLength: Array.from(body).length,
  });

  await message.populate('sender', 'fullName role');

  return buildSafeMessageResponse(message, body);
};

export const listAppointmentMessages = async ({
  appointmentId,
  userId,
  page,
  limit,
}) => {
  await findParticipantAppointment({ appointmentId, userId });

  const filter = { appointment: appointmentId };
  const skip = (page - 1) * limit;
  const [messages, totalItems] = await Promise.all([
    Message.find(filter)
      .select('+encryptedBody +encryptionIv +encryptionAuthTag')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Message.countDocuments(filter),
  ]);
  const decryptedBodies = messages.map(decryptMessageBody);

  await Message.populate(messages, {
    path: 'sender',
    select: 'fullName role',
  });

  return {
    messages: messages.map((message, index) =>
      buildSafeMessageResponse(message, decryptedBodies[index])),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
