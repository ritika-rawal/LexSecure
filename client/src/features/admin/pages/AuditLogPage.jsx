import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoutButton from '../../auth/components/LogoutButton.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import { getAuditLogs } from '../api/auditLog.api.js';
import AuditLogFilters from '../components/AuditLogFilters.jsx';
import { AUDIT_LOG_PAGE_SIZE } from '../constants/auditLog.js';
import {
  formatAuditLabel,
  formatAuditTimestamp,
} from '../utils/auditLog.js';

const EMPTY_FILTERS = Object.freeze({
  action: '',
  outcome: '',
  actorRole: '',
  targetType: '',
  requestId: '',
  targetId: '',
  from: '',
  to: '',
});
const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: AUDIT_LOG_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const AuditLogPage = () => {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadAuditLogs = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getAuditLogs({
          ...filters,
          requestId: filters.requestId.trim(),
          targetId: filters.targetId.trim(),
          page,
          limit: AUDIT_LOG_PAGE_SIZE,
          signal: controller.signal,
        });
        const nextAuditLogs = response.data.auditLogs;
        const nextPagination = response.data.pagination;

        if (
          nextAuditLogs.length === 0
          && page > 1
          && nextPagination.totalPages < page
        ) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setAuditLogs(nextAuditLogs);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setAuditLogs([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Audit logs could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadAuditLogs();
    return () => controller.abort();
  }, [filters, page, reloadKey]);

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#f4f6f5] text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-lg font-bold leading-5">LexSecure</span>
              <span className="text-xs text-gray-600">Security administration</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              aria-label="Admin account security"
              className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100"
              title="Account security"
              to="/admin/account"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="flex h-10 items-center gap-2 border border-gray-300 bg-white px-3 text-sm font-semibold hover:bg-gray-100"
              to="/admin/lawyer-profiles"
            >
              <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Profile reviews</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">Security operations</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Audit logs</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Review security and business events with integrity verification.
            </p>
          </div>
          <button
            className="flex h-10 w-fit items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
            disabled={isLoading}
            onClick={() => setReloadKey((current) => current + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <AuditLogFilters
          filters={draftFilters}
          isLoading={isLoading}
          onApply={() => {
            setFilters(draftFilters);
            setPage(1);
          }}
          onChange={(field, value) =>
            setDraftFilters((current) => ({ ...current, [field]: value }))}
          onClear={clearFilters}
        />

        {loadError ? (
          <div className="mb-6 flex items-start gap-3 border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>{loadError}</p>
              <button
                className="mt-3 text-sm font-semibold underline"
                onClick={() => setReloadKey((current) => current + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading audit logs
          </div>
        ) : null}

        {!isLoading && !loadError && auditLogs.length === 0 ? (
          <section className="border border-line bg-white px-6 py-16 text-center">
            <ShieldCheck aria-hidden="true" className="mx-auto h-9 w-9 text-forest" />
            <h2 className="mt-4 text-xl font-bold">No audit events found</h2>
            <p className="mt-2 text-gray-600">No records match the selected filters.</p>
          </section>
        ) : null}

        {!isLoading && !loadError && auditLogs.length > 0 ? (
          <section aria-label="Audit log results">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm text-gray-600">
              <p>{pagination.totalItems} {pagination.totalItems === 1 ? 'event' : 'events'}</p>
              <p>Page {pagination.page} of {pagination.totalPages}</p>
            </div>

            <div className="overflow-x-auto border border-line bg-white">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead className="bg-ink text-white">
                  <tr>
                    {['Time', 'Action', 'Actor', 'Target', 'Outcome', 'Integrity', 'Correlation'].map((heading) => (
                      <th className="px-4 py-3 font-semibold" key={heading} scope="col">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {auditLogs.map((auditLog) => {
                    const integrityFailed = auditLog.integrityStatus === 'failed';

                    return (
                      <tr className={integrityFailed ? 'bg-red-50' : 'hover:bg-gray-50'} key={auditLog.eventId}>
                        <td className="whitespace-nowrap px-4 py-4 align-top">
                          <time dateTime={auditLog.createdAt}>
                            {formatAuditTimestamp(auditLog.createdAt)}
                          </time>
                        </td>
                        <td className="px-4 py-4 align-top font-semibold">
                          {formatAuditLabel(auditLog.action)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="block font-semibold">{auditLog.actor.fullName}</span>
                          <span className="mt-1 block text-xs capitalize text-gray-500">
                            {auditLog.actor.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="block">{formatAuditLabel(auditLog.target.type)}</span>
                          <span className="mt-1 block max-w-48 break-all font-mono text-xs text-gray-500">
                            {auditLog.target.id || 'None'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex border px-2 py-1 text-xs font-semibold capitalize ${
                            auditLog.outcome === 'success'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-red-300 bg-red-50 text-red-800'
                          }`}>
                            {auditLog.outcome}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${
                            integrityFailed ? 'text-red-700' : 'text-emerald-800'
                          }`}>
                            {integrityFailed ? (
                              <ShieldAlert aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                            )}
                            {integrityFailed ? 'Failed' : 'Verified'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top font-mono text-xs">
                          <span className="block break-all">{auditLog.requestId}</span>
                          <span className="mt-1 block text-gray-500">
                            Source {auditLog.sourceReference}
                          </span>
                          {auditLog.subjectReference ? (
                            <span className="mt-1 block text-gray-500">
                              Subject {auditLog.subjectReference}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 ? (
              <nav className="mt-4 flex items-center justify-end gap-2" aria-label="Audit log pages">
                <button
                  aria-label="Previous page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  title="Previous page"
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label="Next page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  title="Next page"
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </nav>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default AuditLogPage;
