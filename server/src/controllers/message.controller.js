import { MESSAGE_LIST_LIMITS } from '../constants/message.js';
import {
  listAppointmentMessages as listAppointmentMessagesService,
  sendAppointmentMessage as sendAppointmentMessageService,
} from '../services/message.service.js';

const DEFAULT_PAGE = 1;

export const sendAppointmentMessage = async (req, res) => {
  const message = await sendAppointmentMessageService({
    appointmentId: req.params.appointmentId,
    senderId: req.user.id,
    body: req.body.message,
  });

  res.set('Cache-Control', 'private, no-store');
  res.status(201).json({
    status: 'success',
    message: 'Message sent securely.',
    data: {
      message,
    },
  });
};

export const listAppointmentMessages = async (req, res) => {
  const result = await listAppointmentMessagesService({
    appointmentId: req.params.appointmentId,
    userId: req.user.id,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || MESSAGE_LIST_LIMITS.DEFAULT,
  });

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    data: result,
  });
};
