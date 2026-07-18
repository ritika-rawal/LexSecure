import { BadgeCheck, Mail, Scale, ShieldCheck, UserRound } from 'lucide-react';

import LogoutButton from '../components/LogoutButton.jsx';
import { useAuth } from '../hooks/useAuth.js';

const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const AccountPage = () => {
  const { user } = useAuth();

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
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase text-forest">
            {formatRole(user.role)} account
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome, {user.fullName}</h1>
        </div>

        <section aria-labelledby="account-details-heading" className="border-t border-line bg-white">
          <div className="border-b border-line px-5 py-5 sm:px-7">
            <h2 id="account-details-heading" className="text-lg font-bold">
              Account details
            </h2>
          </div>
          <dl className="divide-y divide-line">
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[220px_1fr] sm:px-7">
              <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <UserRound aria-hidden="true" className="h-4 w-4" />
                Full name
              </dt>
              <dd className="break-words">{user.fullName}</dd>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[220px_1fr] sm:px-7">
              <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <Mail aria-hidden="true" className="h-4 w-4" />
                Email address
              </dt>
              <dd className="break-all">{user.email}</dd>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[220px_1fr] sm:px-7">
              <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                Role
              </dt>
              <dd>{formatRole(user.role)}</dd>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[220px_1fr] sm:px-7">
              <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Session
              </dt>
              <dd className="font-medium text-forest">Authenticated</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
};

export default AccountPage;
