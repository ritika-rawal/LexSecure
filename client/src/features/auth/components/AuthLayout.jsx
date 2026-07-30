import { LockKeyhole, Scale, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import authVisual from '../../../assets/lexsecure-hero.png';
import loginVisual from '../../../assets/lexsecure-login.png';
import loginOfficeVisual from '../../../assets/lexsecure-login-office.png';

const AuthLayout = ({ children, securityMessage, visualMode = 'default' }) => {
  const isEditorialLayout = visualMode === 'editorial';

  return (
  <main className="min-h-screen bg-paper">
    <div className={`mx-auto grid min-h-screen ${
      isEditorialLayout
        ? 'lg:grid-cols-[minmax(0,1.08fr)_minmax(500px,0.92fr)]'
        : 'max-w-[1440px] lg:grid-cols-[380px_minmax(0,1fr)]'
    }`}>
      <aside className={`relative overflow-hidden bg-ink px-6 py-7 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12 ${
        isEditorialLayout ? 'lg:px-14 xl:px-20' : 'lg:px-12'
      }`}>
        <img
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover ${
            isEditorialLayout ? 'object-center opacity-80 animate-hero-reveal' : 'object-[72%_center] opacity-30'
          }`}
          src={isEditorialLayout ? loginOfficeVisual : authVisual}
        />
        <div className={`absolute inset-0 ${isEditorialLayout ? 'bg-ink/55' : 'bg-ink/80'}`} />
        <Link className="relative z-10 flex items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/25 bg-white/10 backdrop-blur-md">
            <Scale aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold">LexSecure</span>
        </Link>

        <div className={`relative z-10 mt-12 hidden lg:block ${isEditorialLayout ? 'max-w-xl' : ''}`}>
          <Scale
            aria-hidden="true"
            className={`mb-8 text-emerald-300 ${isEditorialLayout ? 'h-16 w-16' : 'h-20 w-20'}`}
            strokeWidth={1.25}
          />
          <p className={`font-display font-semibold leading-tight ${isEditorialLayout ? 'max-w-lg text-4xl xl:text-5xl' : 'max-w-xs text-3xl'}`}>
            Legal consultations built around confidentiality.
          </p>
          <div className={`mt-8 flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-4 text-sm text-gray-100 shadow-xl backdrop-blur-xl ${isEditorialLayout ? 'max-w-md' : ''}`}>
            <LockKeyhole aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-300" />
            <span>{securityMessage}</span>
          </div>
        </div>

        {isEditorialLayout ? (
          <div className="relative z-10 mt-10 hidden items-end justify-between gap-6 lg:flex">
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-300" />
              </span>
              Protected access
            </div>
            <figure className="auth-photo-card w-44 overflow-hidden rounded-lg border border-white/25 bg-white/10 p-1.5 shadow-2xl backdrop-blur-xl xl:w-52">
              <img alt="Lawyer working privately in her office" className="aspect-[4/3] w-full rounded-md object-cover object-[50%_40%]" src={loginVisual} />
            </figure>
          </div>
        ) : (
          <p className="relative z-10 mt-8 hidden text-xs text-gray-400 lg:block">
            LexSecure university coursework project
          </p>
        )}
      </aside>

      <section className={`relative flex items-center overflow-hidden px-5 py-8 sm:px-8 lg:px-12 xl:px-16 ${isEditorialLayout ? 'bg-[#cfdcd5]' : 'bg-[#e8eeeb]'}`}>
        {isEditorialLayout ? (
          <>
            <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-[0.12] blur-[2px]" src={loginOfficeVisual} />
            <div aria-hidden="true" className="absolute inset-0 bg-[#dce7e1]/70 backdrop-blur-sm" />
            <Scale aria-hidden="true" className="absolute -bottom-20 -right-16 h-72 w-72 text-white/45" strokeWidth={0.6} />
          </>
        ) : null}
        <div className={`relative mx-auto w-full animate-rise-in rounded-lg border border-white/90 shadow-panel backdrop-blur-2xl ${
          isEditorialLayout
            ? 'max-w-[500px] bg-white/55 p-6 shadow-ink/15 sm:p-8'
            : 'max-w-2xl bg-white/70 p-6 sm:p-10'
        }`}>
          {children}
        </div>
      </section>
    </div>
  </main>
  );
};

export default AuthLayout;
