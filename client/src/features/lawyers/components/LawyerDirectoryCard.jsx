import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Languages,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  formatConsultationFee,
  getLawyerInitials,
} from '../utils/publicLawyer.js';

const LawyerDirectoryCard = ({ profile }) => (
  <article className="lawyer-directory-card group flex h-full flex-col overflow-hidden rounded-lg border border-white/90 bg-white/60 shadow-lg shadow-ink/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/80 hover:shadow-panel">
    <div className="flex items-start gap-4 border-b border-white/80 px-5 py-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-forest text-sm font-bold text-white shadow-md transition-transform group-hover:-rotate-2 group-hover:scale-105">
        {getLawyerInitials(profile.lawyer.fullName)}
      </span>
      <div className="min-w-0">
        <h2 className="break-words text-lg font-bold">{profile.lawyer.fullName}</h2>
        <p className="mt-1 break-words text-sm text-forest">{profile.professionalTitle}</p>
      </div>
    </div>

    <div className="flex flex-1 flex-col px-5 py-5">
      <dl className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <BriefcaseBusiness aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <div>
            <dt className="sr-only">Experience</dt>
            <dd>{profile.yearsOfExperience} years of experience</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Languages aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <div>
            <dt className="sr-only">Specializations</dt>
            <dd className="break-words">{profile.specializations.join(', ')}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <div>
            <dt className="sr-only">Consultation fee</dt>
            <dd>{formatConsultationFee(profile.consultationFee)} per consultation</dd>
          </div>
        </div>
      </dl>

      <p className="mt-5 line-clamp-3 break-words text-sm leading-6 text-gray-600">
        {profile.biography}
      </p>

      <Link
        className="mt-6 flex h-10 items-center justify-center gap-2 rounded-lg border border-forest bg-white/50 px-4 text-sm font-semibold text-forest shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
        to={`/lawyers/${profile.id}`}
      >
        View profile
        <ArrowRight aria-hidden="true" className="lawyer-card-arrow h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </article>
);

export default LawyerDirectoryCard;
