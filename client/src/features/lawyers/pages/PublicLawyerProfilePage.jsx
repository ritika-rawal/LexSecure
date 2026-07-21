import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  MoveRight,
  LoaderCircle,
  Scale,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';
import LawyerReviews from '../../reviews/components/LawyerReviews.jsx';
import { getPublicLawyerProfile } from '../api/publicLawyer.api.js';
import {
  formatAvailabilityDay,
  formatConsultationFee,
  getLawyerInitials,
} from '../utils/publicLawyer.js';

const PublicLawyerProfilePage = () => {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPublicLawyerProfile({
          profileId,
          signal: controller.signal,
        });
        setProfile(response.data.profile);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setProfile(null);
        setLoadError(
          getAuthApiError(error, 'The lawyer profile could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [profileId, reloadKey]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">LexSecure</span>
          </div>
          <AuthenticatedHeaderActions />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
          to="/lawyers"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to lawyers
        </Link>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading lawyer profile
          </div>
        ) : null}

        {loadError ? (
          <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-5 text-red-800" role="alert">
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

        {!isLoading && !loadError && profile ? (
          <article>
            <div className="flex flex-col gap-5 border-b border-line bg-white px-6 py-7 sm:flex-row sm:items-center sm:px-8">
              <span className="grid h-16 w-16 shrink-0 place-items-center bg-forest text-lg font-bold text-white">
                {getLawyerInitials(profile.lawyer.fullName)}
              </span>
              <div>
                <p className="mb-1 text-sm font-semibold uppercase text-forest">Approved lawyer</p>
                <h1 className="text-3xl font-bold sm:text-4xl">{profile.lawyer.fullName}</h1>
                <p className="mt-2 text-gray-600">{profile.professionalTitle}</p>
              </div>
            </div>

            <div className="grid bg-white lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="px-6 py-8 sm:px-8">
                <section aria-labelledby="biography-heading">
                  <h2 className="text-xl font-bold" id="biography-heading">Professional biography</h2>
                  <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-gray-700">
                    {profile.biography}
                  </p>
                </section>

                <section className="mt-8" aria-labelledby="specializations-heading">
                  <h2 className="text-xl font-bold" id="specializations-heading">Specializations</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {profile.specializations.map((specialization) => (
                      <li className="border border-line bg-paper px-3 py-2 text-sm" key={specialization}>
                        {specialization}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-8" aria-labelledby="availability-heading">
                  <h2 className="text-xl font-bold" id="availability-heading">Weekly availability</h2>
                  {profile.weeklyAvailability.length > 0 ? (
                    <ul className="mt-4 divide-y divide-line border-y border-line">
                      {profile.weeklyAvailability.map((slot, index) => (
                        <li
                          className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                          key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${index}`}
                        >
                          <span className="font-semibold">
                            {formatAvailabilityDay(slot.dayOfWeek)}
                          </span>
                          <span className="text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-gray-600">No recurring availability is currently listed.</p>
                  )}
                </section>
              </div>

              <aside className="border-t border-line bg-gray-50 px-6 py-8 lg:border-l lg:border-t-0">
                <h2 className="text-lg font-bold">Consultation details</h2>
                <dl className="mt-5 space-y-5">
                  <div>
                    <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
                      Experience
                    </dt>
                    <dd className="mt-1">{profile.yearsOfExperience} years</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <CalendarClock aria-hidden="true" className="h-4 w-4" />
                      Consultation fee
                    </dt>
                    <dd className="mt-1">{formatConsultationFee(profile.consultationFee)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Clock3 aria-hidden="true" className="h-4 w-4" />
                      Timezone
                    </dt>
                    <dd className="mt-1 break-words">{profile.timezone}</dd>
                  </div>
                </dl>
                {profile.weeklyAvailability.length > 0 ? (
                  <Link
                    className="mt-8 flex h-12 items-center justify-center gap-2 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-dark focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
                    to={`/lawyers/${profile.id}/book`}
                  >
                    Request consultation
                    <MoveRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                ) : null}
              </aside>
            </div>
            <LawyerReviews profileId={profile.id} />
          </article>
        ) : null}
      </div>
    </main>
  );
};

export default PublicLawyerProfilePage;
