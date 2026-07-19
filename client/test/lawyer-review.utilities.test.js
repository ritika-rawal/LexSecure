import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAvailabilityDay,
  formatConsultationFee,
  formatSubmittedDate,
} from '../src/features/admin/utils/lawyerReview.js';

test('formats known availability days without accepting markup', () => {
  assert.equal(formatAvailabilityDay('monday'), 'Monday');
  assert.equal(formatAvailabilityDay('<script>'), '<script>');
});

test('formats a valid consultation fee and handles missing data', () => {
  assert.match(formatConsultationFee({ amount: 5000, currency: 'NPR' }), /5[,.]000/);
  assert.equal(formatConsultationFee(), 'Not provided');
});

test('handles malformed submission dates safely', () => {
  assert.equal(formatSubmittedDate('not-a-date'), 'Unknown');
});
