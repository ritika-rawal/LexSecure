import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidWeeklyAvailability } from '../src/utils/availability.js';

test('accepts valid recurring availability with adjacent slots', () => {
  assert.equal(
    isValidWeeklyAvailability([
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'monday', startTime: '12:00', endTime: '15:00' },
      { dayOfWeek: 'wednesday', startTime: '10:30', endTime: '13:30' },
    ]),
    true,
  );
});

test('rejects overlapping slots on the same day', () => {
  assert.equal(
    isValidWeeklyAvailability([
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'monday', startTime: '11:30', endTime: '14:00' },
    ]),
    false,
  );
});

test('rejects invalid times and slots that do not move forward', () => {
  assert.equal(
    isValidWeeklyAvailability([
      { dayOfWeek: 'monday', startTime: '25:00', endTime: '26:00' },
    ]),
    false,
  );
  assert.equal(
    isValidWeeklyAvailability([
      { dayOfWeek: 'monday', startTime: '14:00', endTime: '14:00' },
    ]),
    false,
  );
});

test('rejects unknown days and schedules exceeding the slot limit', () => {
  assert.equal(
    isValidWeeklyAvailability([
      { dayOfWeek: 'holiday', startTime: '09:00', endTime: '10:00' },
    ]),
    false,
  );

  const excessiveAvailability = Array.from({ length: 36 }, (_, index) => ({
    dayOfWeek: 'monday',
    startTime: `${String(index % 24).padStart(2, '0')}:00`,
    endTime: `${String((index + 1) % 24).padStart(2, '0')}:00`,
  }));

  assert.equal(isValidWeeklyAvailability(excessiveAvailability), false);
});
