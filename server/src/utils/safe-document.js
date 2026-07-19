export const buildSafeDocumentResponse = (document) =>
  Object.freeze({
    id: document.id,
    appointmentId: document.appointment.toString(),
    uploadedBy: Object.freeze({
      id: document.uploadedBy?._id?.toString() || document.uploadedBy.toString(),
      fullName: document.uploadedBy?.fullName || 'Account unavailable',
      role: document.uploadedBy?.role || 'client',
    }),
    originalName: document.originalName,
    mimeType: document.mimeType,
    extension: document.extension,
    size: document.size,
    createdAt: document.createdAt,
  });
