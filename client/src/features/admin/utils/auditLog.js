export const formatAuditLabel = (value) =>
  value
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const formatAuditTimestamp = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
};
