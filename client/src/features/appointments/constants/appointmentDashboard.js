export const APPOINTMENT_STATUS_FILTERS = Object.freeze([
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]);

export const APPOINTMENT_VIEW_FILTERS = Object.freeze([
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'history', label: 'History' },
  { value: 'all', label: 'All dates' },
]);

export const APPOINTMENT_DASHBOARD_PAGE_SIZE = 10;
