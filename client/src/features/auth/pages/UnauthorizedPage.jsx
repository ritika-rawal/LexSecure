import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../utils/roleHomePath.js';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 text-ink">
      <div className="w-full max-w-lg border-t-4 border-accent bg-white p-7 shadow-panel sm:p-10">
        <ShieldX aria-hidden="true" className="mb-6 h-11 w-11 text-accent" />
        <p className="mb-2 text-sm font-semibold uppercase text-accent">Access denied</p>
        <h1 className="text-3xl font-bold">You cannot access this area</h1>
        <p className="mt-4 leading-7 text-gray-600">
          Your current account role does not have permission to view this page.
        </p>
        <Link className="mt-7 inline-flex h-11 items-center bg-forest px-5 font-semibold text-white hover:bg-forest-dark" to={getRoleHomePath(user.role)}>
          Return to account
        </Link>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
