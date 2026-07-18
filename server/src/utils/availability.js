import { WEEK_DAYS } from '../constants/lawyer-profile.js';

export const TIME_24_HOUR_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const weekDaySet = new Set(WEEK_DAYS);

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isValidWeeklyAvailability = (availability) => {
  if (!Array.isArray(availability) || availability.length > 35) {
    return false;
  }

  const slotsByDay = new Map();

  for (const slot of availability) {
    if (
      !slot ||
      !weekDaySet.has(slot.dayOfWeek) ||
      !TIME_24_HOUR_PATTERN.test(slot.startTime) ||
      !TIME_24_HOUR_PATTERN.test(slot.endTime)
    ) {
      return false;
    }

    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);

    if (start >= end) {
      return false;
    }

    const daySlots = slotsByDay.get(slot.dayOfWeek) || [];
    daySlots.push({ start, end });
    slotsByDay.set(slot.dayOfWeek, daySlots);
  }

  for (const daySlots of slotsByDay.values()) {
    daySlots.sort((first, second) => first.start - second.start);

    for (let index = 1; index < daySlots.length; index += 1) {
      if (daySlots[index].start < daySlots[index - 1].end) {
        return false;
      }
    }
  }

  return true;
};
