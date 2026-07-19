const CONSULTATION_TYPE_LABELS = Object.freeze({
  video: 'Video call',
  phone: 'Phone call',
  in_person: 'In person',
});

export const formatAppointmentDate = (value, timezone) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeZone: timezone,
  }).format(date);
};

export const formatAppointmentTime = (value, timezone) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  }).format(date);
};

export const formatConsultationType = (value) =>
  CONSULTATION_TYPE_LABELS[value] || value;

export const isExpiredAppointment = (startsAt) => {
  const startTime = new Date(startsAt).getTime();
  return Number.isFinite(startTime) && startTime <= Date.now();
};
