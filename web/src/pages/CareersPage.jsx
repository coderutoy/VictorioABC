import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';

export function CareersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl border-2 border-[#7CD5C7] bg-white/95 p-8 text-center text-[#464B71] shadow-lg backdrop-blur-[2px] sm:p-12 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#464B71] text-[#7CD5C7] shadow-md">
          <Briefcase className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/35 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
            Official Clinic Careers
          </span>
          <h1 className="text-2xl font-extrabold text-[#464B71] sm:text-4xl">
            Careers at Victorio Animal Bite Center
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#464B71]/85 sm:text-base">
            We are currently coordinating open clinic and administrative positions with our branches. Official vacancies will be posted here once confirmed.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/contact"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7CD5C7]"
          >
            <span>Contact Us for General Inquiries</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
