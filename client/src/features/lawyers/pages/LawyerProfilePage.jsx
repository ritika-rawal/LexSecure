import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, LoaderCircle, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';
import { getCurrentLawyerProfile } from '../api/lawyerProfile.api.js';
import LawyerProfileForm from '../components/LawyerProfileForm.jsx';
import { APPROVAL_LABELS } from '../constants/profile.js';

const LawyerProfilePage = () => {
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
        const response = await getCurrentLawyerProfile({ signal: controller.signal });
        setProfile(response.data.profile);
      } catch (error) {
        if (axios.isCancel(error)) return;

        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setProfile(null);
        } else {
          setLoadError(
            getAuthApiError(error, 'Lawyer profile could not be loaded.').message,
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [reloadKey]);

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
          to="/lawyer/account"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to account
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">Lawyer profile</p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {profile ? 'Manage your profile' : 'Create your profile'}
            </h1>
          </div>
          {!isLoading && !loadError ? (
            <div className="flex gap-2 text-sm">
              <span className="border border-line bg-white px-3 py-2 font-semibold">
                {profile ? APPROVAL_LABELS[profile.approvalStatus] : 'Not submitted'}
              </span>
              <span className="border border-line bg-white px-3 py-2 text-gray-600">
                {profile?.isVisible ? 'Visible' : 'Hidden'}
              </span>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 bg-white text-sm font-semibold" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading lawyer profile
          </div>
        ) : null}

        {loadError ? (
          <div className="border border-red-300 bg-red-50 p-5 text-red-800" role="alert">
            <p>{loadError}</p>
            <button
              className="mt-4 h-10 border border-red-400 bg-white px-4 text-sm font-semibold"
              onClick={() => setReloadKey((current) => current + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <LawyerProfileForm initialProfile={profile} onSaved={setProfile} />
        ) : null}
      </div>
    </main>
  );
};

export default LawyerProfilePage;
