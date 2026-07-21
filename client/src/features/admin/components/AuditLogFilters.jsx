import { Filter, X } from 'lucide-react';

import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ACTOR_ROLE_OPTIONS,
  AUDIT_OUTCOME_OPTIONS,
  AUDIT_TARGET_TYPE_OPTIONS,
} from '../constants/auditLog.js';
import { formatAuditLabel } from '../utils/auditLog.js';

const SelectFilter = ({
  id,
  label,
  options,
  value,
  onChange,
}) => (
  <label className="block text-sm font-semibold" htmlFor={id}>
    {label}
    <select
      className="profile-control mt-2"
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">All</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {formatAuditLabel(option)}
        </option>
      ))}
    </select>
  </label>
);

const AuditLogFilters = ({
  filters,
  isLoading,
  onApply,
  onClear,
  onChange,
}) => (
  <form
    className="mb-6 border-y border-line bg-white px-5 py-5 sm:px-6"
    onSubmit={(event) => {
      event.preventDefault();
      onApply();
    }}
  >
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SelectFilter
        id="audit-action"
        label="Action"
        onChange={(value) => onChange('action', value)}
        options={AUDIT_ACTION_OPTIONS}
        value={filters.action}
      />
      <SelectFilter
        id="audit-outcome"
        label="Outcome"
        onChange={(value) => onChange('outcome', value)}
        options={AUDIT_OUTCOME_OPTIONS}
        value={filters.outcome}
      />
      <SelectFilter
        id="audit-actor-role"
        label="Actor role"
        onChange={(value) => onChange('actorRole', value)}
        options={AUDIT_ACTOR_ROLE_OPTIONS}
        value={filters.actorRole}
      />
      <SelectFilter
        id="audit-target-type"
        label="Target type"
        onChange={(value) => onChange('targetType', value)}
        options={AUDIT_TARGET_TYPE_OPTIONS}
        value={filters.targetType}
      />
      <label className="block text-sm font-semibold" htmlFor="audit-request-id">
        Request ID
        <input
          className="profile-control mt-2"
          id="audit-request-id"
          onChange={(event) => onChange('requestId', event.target.value)}
          placeholder="UUID"
          spellCheck="false"
          type="text"
          value={filters.requestId}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="audit-target-id">
        Target ID
        <input
          className="profile-control mt-2"
          id="audit-target-id"
          onChange={(event) => onChange('targetId', event.target.value)}
          placeholder="MongoDB ID"
          spellCheck="false"
          type="text"
          value={filters.targetId}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="audit-from">
        From
        <input
          className="profile-control mt-2"
          id="audit-from"
          onChange={(event) => onChange('from', event.target.value)}
          type="datetime-local"
          value={filters.from}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="audit-to">
        To
        <input
          className="profile-control mt-2"
          id="audit-to"
          onChange={(event) => onChange('to', event.target.value)}
          type="datetime-local"
          value={filters.to}
        />
      </label>
    </div>

    <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
      <button
        className="flex h-10 items-center justify-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
        disabled={isLoading}
        onClick={onClear}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        Clear
      </button>
      <button
        className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        <Filter aria-hidden="true" className="h-4 w-4" />
        Apply filters
      </button>
    </div>
  </form>
);

export default AuditLogFilters;
