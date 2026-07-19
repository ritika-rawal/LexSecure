const WEEK_DAYS = Object.freeze([
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

export const getTodayDateInputValue = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

export const getSlotsForDate = (weeklyAvailability, appointmentDate) => {
  if (!appointmentDate) return [];

  const date = new Date(`${appointmentDate}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return [];

  const dayOfWeek = WEEK_DAYS[date.getUTCDay()];

  return weeklyAvailability.filter((slot) => slot.dayOfWeek === dayOfWeek);
};

export const formatBookingDate = (value) => {
  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(date);
};

export const validateBookingForm = ({
  appointmentDate,
  selectedSlot,
  consultationType,
  legalIssueSummary,
}) => {
  const errors = {};
  const summary = legalIssueSummary.trim();

  if (!appointmentDate) {
    errors.appointmentDate = 'Select an appointment date.';
  }

  if (!selectedSlot) {
    errors.selectedSlot = 'Select one of the available time slots.';
  }

  if (!['video', 'phone', 'in_person'].includes(consultationType)) {
    errors.consultationType = 'Select a consultation type.';
  }

  if (summary.length < 20 || summary.length > 1000) {
    errors.legalIssueSummary = 'Summary must be between 20 and 1000 characters.';
  }

  return errors;
};
