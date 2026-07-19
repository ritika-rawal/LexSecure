import { WEEK_DAYS } from '../constants/profile.js';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/;

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const hasValidAvailability = (slots) => {
  if (slots.length > 35) return false;

  const byDay = new Map();

  for (const slot of slots) {
    if (
      !WEEK_DAYS.includes(slot.dayOfWeek) ||
      !TIME_PATTERN.test(slot.startTime) ||
      !TIME_PATTERN.test(slot.endTime)
    ) {
      return false;
    }

    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    if (start >= end) return false;

    const daySlots = byDay.get(slot.dayOfWeek) || [];
    daySlots.push({ start, end });
    byDay.set(slot.dayOfWeek, daySlots);
  }

  for (const daySlots of byDay.values()) {
    daySlots.sort((first, second) => first.start - second.start);
    for (let index = 1; index < daySlots.length; index += 1) {
      if (daySlots[index].start < daySlots[index - 1].end) return false;
    }
  }

  return true;
};

export const validateLawyerProfile = (values) => {
  const errors = {};
  const title = values.professionalTitle.trim();
  const biography = values.biography.trim();
  const specializations = values.specializations.map((value) => value.trim());
  const normalizedSpecializations = specializations.map((value) => value.toLowerCase());
  const experience = Number(values.yearsOfExperience);
  const fee = Number(values.consultationFeeAmount);

  if (title.length < 2 || title.length > 120) {
    errors.professionalTitle = 'Professional title must be between 2 and 120 characters.';
  }

  if (biography.length < 20 || biography.length > 2000) {
    errors.biography = 'Biography must be between 20 and 2000 characters.';
  }

  if (
    specializations.length < 1 ||
    specializations.length > 10 ||
    specializations.some((value) => value.length < 2 || value.length > 80)
  ) {
    errors.specializations = 'Add between 1 and 10 specializations of 2 to 80 characters.';
  } else if (new Set(normalizedSpecializations).size !== specializations.length) {
    errors.specializations = 'Specializations must be unique.';
  }

  if (!Number.isInteger(experience) || experience < 0 || experience > 70) {
    errors.yearsOfExperience = 'Experience must be a whole number between 0 and 70.';
  }

  if (
    values.consultationFeeAmount === '' ||
    !Number.isFinite(fee) ||
    fee < 0 ||
    fee > 1_000_000
  ) {
    errors.consultationFeeAmount = 'Fee must be between 0 and 1000000.';
  }

  if (!/^[A-Za-z]{3}$/.test(values.consultationFeeCurrency.trim())) {
    errors.consultationFeeCurrency = 'Currency must be a three-letter code.';
  }

  if (
    values.timezone.trim().length > 64 ||
    !TIMEZONE_PATTERN.test(values.timezone.trim())
  ) {
    errors.timezone = 'Enter UTC or an IANA-style timezone.';
  }

  if (!hasValidAvailability(values.weeklyAvailability)) {
    errors.weeklyAvailability =
      'Availability must use valid, non-overlapping time slots.';
  }

  return errors;
};
