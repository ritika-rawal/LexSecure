import { LockKeyhole, Scale } from 'lucide-react';

const AuthLayout = ({ children, securityMessage }) => (
  <main className="min-h-screen bg-paper">
    <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-ink px-6 py-7 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border border-white/25 bg-white/10">
            <Scale aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold">LexSecure</span>
        </div>

        <div className="relative z-10 mt-12 hidden lg:block">
          <Scale
            aria-hidden="true"
            className="mb-8 h-20 w-20 text-emerald-300"
            strokeWidth={1.25}
          />
          <p className="max-w-xs text-3xl font-semibold leading-tight">
            Legal consultations built around confidentiality.
          </p>
          <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6 text-sm text-gray-300">
            <LockKeyhole aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-300" />
            <span>{securityMessage}</span>
          </div>
        </div>

        <p className="relative z-10 mt-8 hidden text-xs text-gray-400 lg:block">
          LexSecure university coursework project
        </p>

        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-48 w-48 translate-x-1/3 translate-y-1/3 border-[32px] border-accent/60"
        />
      </aside>

      <section className="flex items-center px-5 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-2xl bg-white p-6 shadow-panel sm:p-10">
          {children}
        </div>
      </section>
    </div>
  </main>
);

export default AuthLayout;
