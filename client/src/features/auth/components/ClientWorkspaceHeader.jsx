import { CalendarRange, LayoutDashboard, Scale, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

import AuthenticatedHeaderActions from '../../notifications/components/AuthenticatedHeaderActions.jsx';

const navigationItems = [
  { label: 'Dashboard', path: '/client/account', icon: LayoutDashboard },
  { label: 'Appointments', path: '/client/appointments', icon: CalendarRange },
  { label: 'Lawyers', path: '/lawyers', icon: Search },
];

const ClientWorkspaceHeader = ({ activePath }) => (
  <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
      <Link className="flex items-center gap-3" to="/client/account">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white shadow-md">
          <Scale aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-lg font-bold leading-5">LexSecure</span>
          <span className="text-xs text-gray-500">Client workspace</span>
        </span>
      </Link>

      <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-white/90 bg-white/55 p-1 shadow-sm backdrop-blur-xl sm:order-none sm:w-auto" aria-label="Client workspace">
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <Link
            aria-current={activePath === path ? 'page' : undefined}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors ${
              activePath === path
                ? 'bg-ink text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-ink'
            }`}
            key={path}
            to={path}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <AuthenticatedHeaderActions />
    </div>
  </header>
);

export default ClientWorkspaceHeader;
