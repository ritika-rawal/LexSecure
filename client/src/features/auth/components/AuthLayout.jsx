import { LockKeyhole, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

import authVisual from '../../../assets/lexsecure-hero.png';

const AuthLayout = ({ children, securityMessage }) => (
  <main className="min-h-screen bg-paper">
    <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-ink px-6 py-7 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
        <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[72%_center] opacity-30" src={authVisual} />
        <div className="absolute inset-0 bg-ink/80" />
        <Link className="relative z-10 flex items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/25 bg-white/10 backdrop-blur-md">
            <Scale aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold">LexSecure</span>
        </Link>

        <div className="relative z-10 mt-12 hidden lg:block">
          <Scale
            aria-hidden="true"
            className="mb-8 h-20 w-20 text-emerald-300"
            strokeWidth={1.25}
          />
          <p className="max-w-xs font-display text-3xl font-semibold leading-tight">
            Legal consultations built around confidentiality.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-gray-200 backdrop-blur-lg">
            <LockKeyhole aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-300" />
            <span>{securityMessage}</span>
          </div>
        </div>

        <p className="relative z-10 mt-8 hidden text-xs text-gray-400 lg:block">
          LexSecure university coursework project
        </p>
      </aside>

      <section className="flex items-center bg-[#e8eeeb] px-5 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-2xl animate-rise-in rounded-lg border border-white/80 bg-white/80 p-6 shadow-panel backdrop-blur-xl sm:p-10">
          {children}
        </div>
      </section>
    </div>
  </main>
);

export default AuthLayout;
