const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const WEEK_DAYS = Object.freeze([
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

const parseLocalDateTime = (dateValue, timeValue) => {
  const dateMatch = LOCAL_DATE_PATTERN.exec(dateValue);
  const timeMatch = LOCAL_TIME_PATTERN.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    throw new RangeError('Appointment date or time is invalid.');
  }

  const parts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const calendarCheck = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  ));

  if (
    calendarCheck.getUTCFullYear() !== parts.year
    || calendarCheck.getUTCMonth() !== parts.month - 1
    || calendarCheck.getUTCDate() !== parts.day
    || parts.hour > 23
    || parts.minute > 59
  ) {
    throw new RangeError('Appointment date or time is invalid.');
  }

  return parts;
};

const getZonedParts = (date, timezone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
};

const partsToTimestamp = ({ year, month, day, hour, minute }) => {
  return Date.UTC(year, month - 1, day, hour, minute);
};

const partsMatch = (left, right) =>
  left.year === right.year
  && left.month === right.month
  && left.day === right.day
  && left.hour === right.hour
  && left.minute === right.minute;

export const isValidLocalDate = (value) => {
  try {
    parseLocalDateTime(value, '00:00');
    return true;
  } catch {
    return false;
  }
};

export const getWeekDayForLocalDate = (dateValue) => {
  const parts = parseLocalDateTime(dateValue, '12:00');
  return WEEK_DAYS[new Date(partsToTimestamp(parts)).getUTCDay()];
};

export const localDateTimeToUtc = ({ dateValue, timeValue, timezone }) => {
  const desiredParts = parseLocalDateTime(dateValue, timeValue);
  const desiredTimestamp = partsToTimestamp(desiredParts);
  let candidateTimestamp = desiredTimestamp;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const representedParts = getZonedParts(new Date(candidateTimestamp), timezone);
    const difference = desiredTimestamp - partsToTimestamp(representedParts);

    candidateTimestamp += difference;

    if (difference === 0) {
      break;
    }
  }

  const result = new Date(candidateTimestamp);

  if (!partsMatch(getZonedParts(result, timezone), desiredParts)) {
    throw new RangeError('The selected local time does not exist in this timezone.');
  }

  return result;
};

export const buildReservedTimeBlocks = (startsAt, endsAt) => {
  const blockSizeMs = 15 * 60 * 1000;
  const firstBlock = Math.floor(startsAt.getTime() / blockSizeMs) * blockSizeMs;
  const blocks = [];

  for (let timestamp = firstBlock; timestamp < endsAt.getTime(); timestamp += blockSizeMs) {
    blocks.push(new Date(timestamp));
  }

  return blocks;
};
