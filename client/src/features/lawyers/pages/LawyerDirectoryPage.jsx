import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Scale,
  Search,
  UsersRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';
import { getPublicLawyerProfiles } from '../api/publicLawyer.api.js';
import LawyerDirectoryCard from '../components/LawyerDirectoryCard.jsx';
import { validateSpecializationFilter } from '../utils/publicLawyer.js';

const PAGE_SIZE = 12;
const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const LawyerDirectoryPage = () => {
  const [filterInput, setFilterInput] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [filterError, setFilterError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfiles = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPublicLawyerProfiles({
          page,
          limit: PAGE_SIZE,
          specialization,
          signal: controller.signal,
        });
        const nextProfiles = response.data.profiles;
        const nextPagination = response.data.pagination;

        if (nextProfiles.length === 0 && page > 1 && nextPagination.totalPages < page) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setProfiles(nextProfiles);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setProfiles([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Approved lawyers could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadProfiles();
    return () => controller.abort();
  }, [page, reloadKey, specialization]);

  const applyFilter = (event) => {
    event.preventDefault();
    const validationError = validateSpecializationFilter(filterInput);

    if (validationError) {
      setFilterError(validationError);
      return;
    }

    setFilterError('');
    setPage(1);
    setSpecialization(filterInput.trim());
  };

  const clearFilter = () => {
    setFilterInput('');
    setFilterError('');
    setPage(1);
    setSpecialization('');
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">LexSecure</span>
          </div>
          <AuthenticatedHeaderActions />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
          to="/client/account"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to account
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase text-forest">Approved professionals</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Find a lawyer</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Browse verified professional profiles and recurring consultation availability.
          </p>
        </div>

        <form
          className="mb-8 border-y border-line bg-white px-5 py-5 sm:px-6"
          noValidate
          onSubmit={applyFilter}
        >
          <label className="mb-2 block text-sm font-semibold" htmlFor="specialization-filter">
            Filter by exact specialization
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                aria-describedby={filterError ? 'specialization-filter-error' : undefined}
                aria-invalid={Boolean(filterError)}
                className="form-input"
                id="specialization-filter"
                maxLength={80}
                onChange={(event) => {
                  setFilterInput(event.target.value);
                  if (filterError) setFilterError('');
                }}
                placeholder="For example, Family Law"
                type="search"
                value={filterInput}
              />
            </div>
            <button
              className="h-12 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              Apply filter
            </button>
            {specialization ? (
              <button
                className="flex h-12 items-center justify-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100"
                onClick={clearFilter}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Clear
              </button>
            ) : null}
          </div>
          {filterError ? (
            <p className="mt-2 text-sm text-red-700" id="specialization-filter-error" role="alert">
              {filterError}
            </p>
          ) : null}
        </form>

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
          <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading approved lawyers
          </div>
        ) : null}

        {!isLoading && !loadError && profiles.length === 0 ? (
          <section className="border border-line bg-white px-6 py-16 text-center">
            <UsersRound aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-forest" />
            <h2 className="text-xl font-bold">No lawyers found</h2>
            <p className="mt-2 text-gray-600">
              {specialization
                ? `No approved profiles match "${specialization}".`
                : 'There are currently no approved lawyer profiles.'}
            </p>
          </section>
        ) : null}

        {!isLoading && !loadError && profiles.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-4 text-sm text-gray-600">
              <p>{pagination.totalItems} approved {pagination.totalItems === 1 ? 'lawyer' : 'lawyers'}</p>
              <p>Page {pagination.page} of {pagination.totalPages}</p>
            </div>
            <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <LawyerDirectoryCard key={profile.id} profile={profile} />
              ))}
            </div>

            {pagination.totalPages > 1 ? (
              <nav className="mt-7 flex items-center justify-end gap-2" aria-label="Lawyer directory pages">
                <button
                  aria-label="Previous page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  title="Previous page"
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label="Next page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  title="Next page"
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
};

export default LawyerDirectoryPage;
