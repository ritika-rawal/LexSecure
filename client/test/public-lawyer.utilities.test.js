import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAvailabilityDay,
  formatConsultationFee,
  getLawyerInitials,
  validateSpecializationFilter,
} from '../src/features/lawyers/utils/publicLawyer.js';

test('formats lawyer names and public consultation data', () => {
  assert.equal(getLawyerInitials('Rita Sharma'), 'RS');
  assert.equal(getLawyerInitials(''), 'LS');
  assert.equal(formatAvailabilityDay('friday'), 'Friday');
  assert.match(formatConsultationFee({ amount: 5000, currency: 'NPR' }), /5[,.]000/);
});

test('validates the specialization filter before sending it', () => {
  assert.equal(validateSpecializationFilter(''), '');
  assert.equal(validateSpecializationFilter('Family Law'), '');
  assert.match(validateSpecializationFilter('x'), /at least 2/);
  assert.match(validateSpecializationFilter('x'.repeat(81)), /80/);
});
