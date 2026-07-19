import { useState } from 'react';
import { CalendarRange, Search, X } from 'lucide-react';

const AppointmentHistoryFilters = ({
  filters,
  isLoading,
  onApply,
  participantLabel,
}) => {
  const [search, setSearch] = useState(filters.search);
  const [fromDate, setFromDate] = useState(filters.fromDate);
  const [toDate, setToDate] = useState(filters.toDate);
  const [validationError, setValidationError] = useState('');
  const hasFilters = Boolean(filters.search || filters.fromDate || filters.toDate);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedSearch = search.trim();

    if (normalizedSearch && normalizedSearch.length < 2) {
      setValidationError('Search must contain at least 2 characters.');
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setValidationError('The end date must be on or after the start date.');
      return;
    }

    setValidationError('');
    onApply({
      search: normalizedSearch,
      fromDate,
      toDate,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setValidationError('');
    onApply({
      search: '',
      fromDate: '',
      toDate: '',
    });
  };

  return (
    <form
      className="mb-7 border border-line bg-white"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] md:items-end">
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="participant-search"
          >
            Search {participantLabel}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            />
            <input
              className="profile-control pl-10"
              disabled={isLoading}
              id="participant-search"
              maxLength={80}
              onChange={(event) => {
                setSearch(event.target.value);
                setValidationError('');
              }}
              placeholder={`Enter ${participantLabel.toLowerCase()} name`}
              type="search"
              value={search}
            />
          </div>
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="appointment-from-date"
          >
            From date
          </label>
          <input
            className="profile-control"
            disabled={isLoading}
            id="appointment-from-date"
            onChange={(event) => {
              setFromDate(event.target.value);
              setValidationError('');
            }}
            type="date"
            value={fromDate}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="appointment-to-date"
          >
            To date
          </label>
          <input
            className="profile-control"
            disabled={isLoading}
            id="appointment-to-date"
            min={fromDate || undefined}
            onChange={(event) => {
              setToDate(event.target.value);
              setValidationError('');
            }}
            type="date"
            value={toDate}
          />
        </div>

        <div className="flex gap-2">
          {hasFilters ? (
            <button
              aria-label="Clear appointment filters"
              className="grid h-11 w-11 shrink-0 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-60"
              disabled={isLoading}
              onClick={clearFilters}
              title="Clear filters"
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          ) : null}
          <button
            className="flex h-11 flex-1 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            <CalendarRange aria-hidden="true" className="h-4 w-4" />
            Apply
          </button>
        </div>
      </div>

      {validationError ? (
        <p className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {validationError}
        </p>
      ) : null}
    </form>
  );
};

export default AppointmentHistoryFilters;
