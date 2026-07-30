import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck2,
  FileLock2,
  LockKeyhole,
  MessageSquareText,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import heroImage from '../../../assets/lexsecure-hero.png';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { getRoleHomePath } from '../../auth/utils/roleHomePath.js';

const serviceItems = [
  {
    icon: UserRoundCheck,
    title: 'Verified legal professionals',
    description: 'Connect with approved lawyers whose profiles and availability are kept in one place.',
  },
  {
    icon: CalendarCheck2,
    title: 'Consultations on your terms',
    description: 'Book, reschedule, and follow each consultation through a clear appointment workspace.',
  },
  {
    icon: FileLock2,
    title: 'Confidential by design',
    description: 'Keep legal documents and appointment conversations protected throughout the matter.',
  },
];

const LandingPage = () => {
  const { user } = useAuth();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const progressRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const primaryPath = user ? getRoleHomePath(user.role) : '/register';
  const primaryLabel = user ? 'Open workspace' : 'Create secure account';

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateHeader = () => {
      setIsScrolled(window.scrollY > 24);

      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableDistance > 0
        ? Math.min(1, window.scrollY / scrollableDistance)
        : 0;
      progressRef.current?.style.setProperty('transform', `scaleX(${progress})`);
      heroRef.current?.style.setProperty(
        '--hero-scroll',
        `${Math.min(22, window.scrollY * 0.035)}px`,
      );
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (reducedMotionQuery.matches) {
      return () => window.removeEventListener('scroll', updateHeader);
    }

    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.14 },
    );

    pageRef.current
      ?.querySelectorAll('[data-reveal]')
      .forEach((element) => revealObserver.observe(element));

    return () => {
      window.removeEventListener('scroll', updateHeader);
      revealObserver.disconnect();
      document.documentElement.classList.remove('motion-ready');
    };
  }, []);

  const moveHero = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = heroRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
    const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;

    heroRef.current.style.setProperty('--hero-x', `${horizontalPosition * -12}px`);
    heroRef.current.style.setProperty('--hero-y', `${verticalPosition * -8}px`);
  };

  const resetHero = () => {
    heroRef.current?.style.setProperty('--hero-x', '0px');
    heroRef.current?.style.setProperty('--hero-y', '0px');
  };

  const tiltCard = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
    const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty('--card-rotate-x', `${verticalPosition * -5}deg`);
    event.currentTarget.style.setProperty('--card-rotate-y', `${horizontalPosition * 7}deg`);
  };

  const resetCard = (event) => {
    event.currentTarget.style.setProperty('--card-rotate-x', '0deg');
    event.currentTarget.style.setProperty('--card-rotate-y', '0deg');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink" ref={pageRef}>
      <div aria-hidden="true" className="intro-curtain" />
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 bg-white/20">
        <span className="scroll-progress block h-full origin-left bg-accent" ref={progressRef} />
      </div>
      <header className={`fixed inset-x-0 top-0 z-30 px-3 pt-3 transition-colors duration-300 sm:px-5 ${isScrolled ? 'text-ink' : 'text-white'}`}>
        <div className={`mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 rounded-lg border px-4 shadow-lg backdrop-blur-xl transition-all duration-300 sm:px-6 ${
          isScrolled
            ? 'border-white/80 bg-white/80 shadow-ink/10'
            : 'border-white/25 bg-ink/35 shadow-black/20'
        }`}>
          <Link className="group flex items-center gap-3" to="/" aria-label="LexSecure home">
            <span className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors ${
              isScrolled
                ? 'border-line bg-ink text-white group-hover:bg-forest'
                : 'border-white/25 bg-white/10 group-hover:bg-white/20'
            }`}>
              <Scale aria-hidden="true" className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold">LexSecure</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Main navigation">
            <a className={`nav-underline transition-colors ${isScrolled ? 'hover:text-forest' : 'hover:text-emerald-200'}`} href="#services">Services</a>
            <a className={`nav-underline transition-colors ${isScrolled ? 'hover:text-forest' : 'hover:text-emerald-200'}`} href="#security">Security</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!user ? (
              <Link className={`hidden rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:inline-flex ${
                isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
              }`} to="/login">
                Sign in
              </Link>
            ) : null}
            <Link className={`group inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 ${
              isScrolled
                ? 'bg-forest text-white hover:bg-forest-dark'
                : 'bg-white text-ink hover:bg-emerald-50'
            }`} to={primaryPath}>
              {user ? 'Workspace' : 'Get started'}
              <ArrowRight aria-hidden="true" className="cta-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative flex min-h-[min(860px,92vh)] items-center overflow-hidden text-white"
        aria-labelledby="hero-title"
        onMouseLeave={resetHero}
        onMouseMove={moveHero}
        ref={heroRef}
      >
        <div className="hero-parallax absolute -inset-4">
          <img
            alt="Lawyer reviewing a confidential case file with a client"
            className="h-full w-full object-cover object-[68%_center] animate-hero-reveal"
            src={heroImage}
          />
        </div>
        <div className="absolute inset-0 bg-ink/40" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pt-40">
          <div className="hero-copy max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase text-emerald-200">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              Secure legal consultations
            </p>
            <h1 aria-label="LexSecure" className="font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl" id="hero-title">
              <span aria-hidden="true" className="hero-word inline-block">Lex</span>
              <span aria-hidden="true" className="hero-word hero-word-delayed inline-block text-emerald-200">Secure</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-200 sm:text-xl">
              A confidential place to find legal support, manage consultations, and keep every important detail together.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-accent/90 px-6 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-accent" to={primaryPath}>
                {primaryLabel}
                <ArrowRight aria-hidden="true" className="cta-arrow h-4 w-4" />
              </Link>
              {!user ? (
                <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/20" to="/login">
                  Sign in to LexSecure
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-20 hidden rounded-lg border border-white/20 bg-ink/55 px-7 py-4 shadow-xl backdrop-blur-xl lg:block">
          <p className="flex items-center gap-3 text-sm font-semibold">
            <LockKeyhole aria-hidden="true" className="h-5 w-5 text-emerald-300" />
            Your legal matters stay private
          </p>
        </div>
      </section>

      <div className="security-rail border-y border-white/10 bg-forest py-4 text-white" aria-label="LexSecure protection highlights">
        <div className="security-track flex w-max items-center gap-10 whitespace-nowrap text-xs font-bold uppercase">
          {[0, 1].map((copyIndex) => (
            <div aria-hidden={copyIndex === 1} className="flex items-center gap-10" key={copyIndex}>
              {['Encrypted documents', 'Protected sessions', 'Verified lawyers', 'Multi-factor authentication', 'Role-based access'].map((label) => (
                <span className="flex items-center gap-3" key={label}>
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-200" />
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#dce8e2] py-20 sm:py-24" id="services" aria-labelledby="services-title">
        <Scale aria-hidden="true" className="absolute -right-20 top-4 h-80 w-80 text-white/45" strokeWidth={0.65} />
        <div aria-hidden="true" className="absolute bottom-10 left-0 h-28 w-2/5 rounded-r-lg border-y border-r border-white/55 bg-white/20 backdrop-blur-sm" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl" data-reveal="up">
            <p className="text-sm font-semibold uppercase text-forest">A clearer legal journey</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl" id="services-title">
              From first contact to consultation history
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {serviceItems.map(({ icon: Icon, title, description }, index) => (
              <article
                className="h-full"
                data-reveal="up"
                key={title}
                style={{ '--reveal-delay': `${index * 110}ms` }}
              >
                <div
                  className="service-card group h-full rounded-lg border border-white/90 bg-white/45 p-6 shadow-xl shadow-ink/10 backdrop-blur-2xl hover:border-white hover:bg-white/70 hover:shadow-panel sm:p-7"
                  onMouseLeave={resetCard}
                  onMouseMove={tiltCard}
                >
                  <span className="service-icon grid h-12 w-12 place-items-center rounded-lg border border-white/15 bg-ink/95 text-white shadow-md transition-colors group-hover:bg-forest">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-gray-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-ink py-20 text-white sm:py-24" id="security" aria-labelledby="security-title">
        <ShieldCheck aria-hidden="true" className="absolute -bottom-28 -left-20 h-96 w-96 text-white/[0.04]" strokeWidth={0.55} />
        <div aria-hidden="true" className="absolute right-0 top-12 h-36 w-1/3 rounded-l-lg border-y border-l border-white/10 bg-white/[0.04] backdrop-blur-sm" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div data-reveal="left">
            <p className="text-sm font-semibold uppercase text-emerald-300">Security at every step</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl" id="security-title">
              Legal work deserves more than ordinary protection.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-gray-300">
              LexSecure combines controlled access with protected sessions and confidential data handling across the platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" data-reveal="right">
            {[
              [LockKeyhole, 'Protected sessions'],
              [FileLock2, 'Encrypted documents'],
              [MessageSquareText, 'Confidential messaging'],
              [ShieldCheck, 'Role-based access'],
            ].map(([Icon, label]) => (
              <div className="security-glass-tile group flex min-h-32 items-center gap-4 rounded-lg border border-white/15 bg-white/[0.08] p-5 shadow-xl shadow-black/15 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.14]" key={label}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10 text-emerald-200 shadow-inner backdrop-blur-md transition-transform group-hover:scale-105">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">Your next legal consultation starts here.</h2>
            <p className="mt-2 text-gray-300">Private, organised, and ready when you are.</p>
          </div>
          <Link className="group inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-lg border border-white/70 bg-white/90 px-6 py-3 text-sm font-bold text-ink shadow-lg backdrop-blur-lg transition hover:-translate-y-0.5 hover:bg-white" to={primaryPath}>
            {primaryLabel}
            <ArrowRight aria-hidden="true" className="cta-arrow h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-ink py-7 text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 text-sm sm:px-8 md:flex-row md:items-center">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Scale aria-hidden="true" className="h-4 w-4" />
            LexSecure
          </p>
          <p>Secure lawyer appointment and client management.</p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
