const DAY_LABELS = Object.freeze({
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
});

export const formatAvailabilityDay = (day) => DAY_LABELS[day] || day;

export const formatConsultationFee = ({ amount, currency } = {}) => {
  if (!Number.isFinite(amount) || typeof currency !== 'string') {
    return 'Not provided';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export const getLawyerInitials = (fullName = '') => {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'LS';
};

export const validateSpecializationFilter = (value) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 1) {
    return 'Enter at least 2 characters or clear the filter.';
  }

  if (normalizedValue.length > 80) {
    return 'Specialization must not exceed 80 characters.';
  }

  return '';
};
