import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  Mail,
  Inbox,
  CalendarRange,
  ClipboardCheck,
  Scale,
  ScrollText,
  ShieldCheck,
  ShieldBan,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import AccountDataExport from '../../export/components/AccountDataExport.jsx';
import AccountDataImport from '../../export/components/AccountDataImport.jsx';
import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';
import MfaSecurityPanel from '../components/MfaSecurityPanel.jsx';
import PasswordSecurityPanel from '../components/PasswordSecurityPanel.jsx';
import ClientDashboard from '../components/ClientDashboard.jsx';
import { USER_ROLES } from '../constants/userRoles.js';
import { useAuth } from '../hooks/useAuth.js';

const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const AccountPage = () => {
  const { user } = useAuth();

  if (user.role === USER_ROLES.CLIENT) {
    return <ClientDashboard user={user} />;
  }

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

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">{formatRole(user.role)} account</p>
        <h1 className="mb-10 text-3xl font-bold sm:text-4xl">Welcome, {user.fullName}</h1>
        {user.role === USER_ROLES.LAWYER ? (
          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50"
              to="/lawyer/schedule"
            >
              <span className="flex items-center gap-3">
                <CalendarRange aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">My schedule</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    View consultation history and status
                  </span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50"
              to="/lawyer/appointments"
            >
              <span className="flex items-center gap-3">
                <Inbox aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">Appointment requests</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Review pending consultation requests
                  </span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50"
              to="/lawyer/profile"
            >
              <span className="flex items-center gap-3">
                <BriefcaseBusiness aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">Lawyer profile</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Manage professional details and availability
                  </span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
          </div>
        ) : null}
        {user.role === USER_ROLES.ADMIN ? (
          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50 sm:px-7"
              to="/admin/lawyer-profiles"
            >
              <span className="flex items-center gap-3">
                <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">Lawyer reviews</span>
                  <span className="mt-1 block text-sm text-gray-600">Review pending professional profiles</span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50 sm:px-7"
              to="/admin/audit-logs"
            >
              <span className="flex items-center gap-3">
                <ScrollText aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">Security audit logs</span>
                  <span className="mt-1 block text-sm text-gray-600">Inspect protected platform events</span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 border-l-4 border-forest bg-white px-5 py-5 hover:bg-emerald-50 sm:px-7"
              to="/admin/ip-access"
            >
              <span className="flex items-center gap-3">
                <ShieldBan aria-hidden="true" className="h-5 w-5 text-forest" />
                <span>
                  <span className="block font-bold">IP access policy</span>
                  <span className="mt-1 block text-sm text-gray-600">Manage trusted and blocked networks</span>
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-500" />
            </Link>
          </div>
        ) : null}
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
        <PasswordSecurityPanel />
        <MfaSecurityPanel />
        {user.role !== USER_ROLES.ADMIN ? (
          <>
            <AccountDataExport />
            <AccountDataImport />
          </>
        ) : null}
      </div>
    </main>
  );
};

export default AccountPage;
