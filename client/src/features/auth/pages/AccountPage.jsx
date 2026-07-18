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
        <p className="mb-2 text-sm font-semibold uppercase text-forest">{formatRole(user.role)} account</p>
        <h1 className="mb-10 text-3xl font-bold sm:text-4xl">Welcome, {user.fullName}</h1>
        <section className="border-t border-line bg-white" aria-labelledby="account-heading">
          <div className="border-b border-line px-5 py-5 sm:px-7">
            <h2 id="account-heading" className="text-lg font-bold">Account details</h2>
          </div>
          <dl className="divide-y divide-line">
            {[
              { label: 'Full name', value: user.fullName, Icon: UserRound },
              { label: 'Email address', value: user.email, Icon: Mail },
              { label: 'Role', value: formatRole(user.role), Icon: BadgeCheck },
              { label: 'Session', value: 'Authenticated', Icon: ShieldCheck },
            ].map(({ label, value, Icon }) => (
              <div className="grid gap-2 px-5 py-5 sm:grid-cols-[220px_1fr] sm:px-7" key={label}>
                <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
};

export default AccountPage;
