import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  CalendarRange,
  ChevronRight,
  Home,
  Mail,
  Scale,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import dashboardVisual from '../../../assets/lexsecure-hero.png';
import AccountDataExport from '../../export/components/AccountDataExport.jsx';
import AccountDataImport from '../../export/components/AccountDataImport.jsx';
import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';
import MfaSecurityPanel from './MfaSecurityPanel.jsx';
import PasswordSecurityPanel from './PasswordSecurityPanel.jsx';

const dashboardSections = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'consultations', label: 'Consultations', icon: CalendarRange },
  { id: 'profile-security', label: 'Profile & security', icon: ShieldCheck },
];

const ClientDashboard = ({ user }) => {
  const pageRef = useRef(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const sections = dashboardSections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reducedMotion) pageRef.current?.classList.add('dashboard-motion-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActiveSection(entry.target.id);
          entry.target.classList.add('is-visible');
        });
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: 0.05 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const accountDetails = [
    { label: 'Full name', value: user.fullName, icon: UserRound },
    { label: 'Email address', value: user.email, icon: Mail },
    { label: 'Account type', value: 'Client', icon: BadgeCheck },
    {
      label: 'Two-factor authentication',
      value: user.mfaEnabled ? 'Enabled' : 'Not enabled',
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#e8eeeb] text-ink" ref={pageRef}>
      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link className="flex items-center gap-3" to="/client/account">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-md">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-5">LexSecure</span>
              <span className="text-xs text-gray-500">Client workspace</span>
            </span>
          </Link>
          <AuthenticatedHeaderActions />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-lg border border-white/90 bg-white/60 shadow-lg shadow-ink/5 backdrop-blur-xl">
            <div className="border-b border-white/90 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-forest text-lg font-bold text-white shadow-md">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <p className="mt-3 truncate font-bold">{user.fullName}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <nav className="p-2" aria-label="Client dashboard sections">
              {dashboardSections.map(({ id, label, icon: Icon }) => (
                <a
                  aria-current={activeSection === id ? 'location' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    activeSection === id
                      ? 'bg-ink text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-ink'
                  }`}
                  href={`#${id}`}
                  key={id}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section
            className="relative min-h-44 scroll-mt-24 overflow-hidden rounded-lg text-white shadow-panel"
            data-dashboard-reveal
            id="overview"
          >
            <img alt="Lawyer reviewing a case with a client" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" src={dashboardVisual} />
            <div className="absolute inset-0 bg-ink/60" />
            <div className="relative flex min-h-44 flex-col justify-center px-6 py-7 sm:px-8">
              <p className="text-xs font-bold uppercase text-emerald-200">Client dashboard</p>
              <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Welcome, {user.fullName}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-200 sm:text-base">
                Manage consultations and account security from one private workspace.
              </p>
            </div>
          </section>

          <section className="scroll-mt-24" data-dashboard-reveal id="consultations" aria-labelledby="consultations-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-forest">Your legal workspace</p>
                <h2 className="mt-1 text-2xl font-bold" id="consultations-heading">Consultations</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Link className="dashboard-action group flex min-h-32 items-center justify-between gap-5 rounded-lg border border-white/90 bg-white/60 p-5 shadow-lg shadow-ink/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/85 hover:shadow-panel" to="/client/appointments">
                <span className="flex min-w-0 items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-white shadow-md">
                    <CalendarRange aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold">My appointments</span>
                    <span className="mt-2 block text-sm leading-6 text-gray-600">Track requests, consultation status and history.</span>
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="dashboard-action-arrow h-5 w-5 shrink-0 text-gray-400" />
              </Link>
              <Link className="dashboard-action group flex min-h-32 items-center justify-between gap-5 rounded-lg border border-white/90 bg-white/60 p-5 shadow-lg shadow-ink/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/85 hover:shadow-panel" to="/lawyers">
                <span className="flex min-w-0 items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent text-white shadow-md">
                    <Search aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold">Find a lawyer</span>
                    <span className="mt-2 block text-sm leading-6 text-gray-600">Browse approved profiles and available times.</span>
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="dashboard-action-arrow h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            </div>
          </section>

          <section className="scroll-mt-24" data-dashboard-reveal id="profile-security" aria-labelledby="profile-security-heading">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-forest">Personal settings</p>
              <h2 className="mt-1 text-2xl font-bold" id="profile-security-heading">Profile & security</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Review your account, two-factor authentication and personal data controls.
              </p>
            </div>

            <div className="client-profile-stack">
              <section className="account-detail-panel" aria-labelledby="client-details-heading">
                <div className="border-b border-white/80 px-5 py-4 sm:px-6">
                  <h3 className="font-bold" id="client-details-heading">Account details</h3>
                </div>
                <dl className="grid gap-px bg-white/70 sm:grid-cols-2">
                  {accountDetails.map(({ label, value, icon: Icon }) => (
                    <div className="bg-white/70 p-5 backdrop-blur-lg" key={label}>
                      <dt className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                        <Icon aria-hidden="true" className="h-4 w-4 text-forest" />
                        {label}
                      </dt>
                      <dd className="mt-2 break-words font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <PasswordSecurityPanel />
              <MfaSecurityPanel />
              <AccountDataExport />
              <AccountDataImport />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ClientDashboard;
