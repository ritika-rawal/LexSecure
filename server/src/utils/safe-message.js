export const buildSafeMessageResponse = (message, decryptedBody) =>
  Object.freeze({
    id: message.id,
    appointmentId: message.appointment.toString(),
    sender: Object.freeze({
      id:
        message.sender?._id?.toString()
        || message.sender?.toString()
        || null,
      fullName: message.sender?.fullName || 'Account unavailable',
      role: message.sender?.role || null,
    }),
    message: decryptedBody,
    createdAt: message.createdAt,
  });
