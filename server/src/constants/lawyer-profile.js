export const WEEK_DAYS = Object.freeze([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const LAWYER_APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const LAWYER_APPROVAL_STATUS_VALUES = Object.freeze(
  Object.values(LAWYER_APPROVAL_STATUS),
);
