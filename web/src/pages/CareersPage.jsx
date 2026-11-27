import { Link } from 'react-router-dom';
import {
  Briefcase,
  Stethoscope,
  Syringe,
  Users,
  MapPin,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const OPEN_ROLES = [
  {
    title: 'Clinic Attending Physician (MD)',
    type: 'Full-Time / Reliever • All 7 Branches',
    icon: Stethoscope,
    requirements: [
      'Valid PRC Physician License',
      'Training or experience in WHO Rabies Post-Exposure Prophylaxis & ERIG infiltration',
      'Commitment to compassionate, evidence-based clinical care',
    ],
  },
  {
    title: 'Animal Bite Center Registered Nurse (RN)',
    type: 'Full-Time • Bulacan & Caloocan Branches',
    icon: Syringe,
    requirements: [
      'Valid PRC Nursing License (ABTC certification is an advantage)',
      'Proficient in Intradermal (ID) & Intramuscular (IM) vaccine administration and skin testing',
      'Detail-oriented with digital QR check-in and cold-chain inventory logging',
    ],
  },
  {
    title: 'Clinic Reception & Patient Care Coordinator',
    type: 'Full-Time • All 7 Branches',
    icon: Users,
    requirements: [
      'Warm, patient-first communication skills for walk-in families and elderly/PWD patients',
      'Computer literacy for QR Pass check-in and queue management',
      'Residing near Baliwag, Santa Maria, Pandi, DRT, Meycauayan, or Caloocan',
    ],
  },
];

export function CareersPage() {
  const { publicBranches, selectedPublicBranch } = useBranch();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="max-w-2xl space-y-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
            <Briefcase className="h-4 w-4" />
            <span>Join Our 7-Branch Clinical Team</span>
          </span>
          <h1 className="text-2xl font-extrabold sm:text-4xl">
            Careers at Victorio Animal Bite Center
          </h1>
          <p className="text-sm text-white/85 sm:text-base">
            Help us eliminate human rabies across Bulacan and Metro Manila through accessible, WHO-aligned clinical care.
          </p>
        </div>
      </div>

      {/* Open Roles Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {OPEN_ROLES.map(({ title, type, icon: Icon, requirements }) => (
          <div
            key={title}
            className="flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
                <Icon className="h-6 w-6" />
              </div>
              <span className="mt-3 inline-block rounded-full bg-[#7CD5C7]/35 px-2.5 py-0.5 text-[11px] font-extrabold text-[#464B71]">
                {type}
              </span>
              <h2 className="mt-2 text-lg font-extrabold text-[#464B71]">{title}</h2>
              <ul className="mt-4 space-y-2 text-xs text-[#464B71]/90">
                {requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-[#F2F2ED] pt-4">
              <a
                href={`tel:${selectedPublicBranch.contactNumber}`}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Inquire at {selectedPublicBranch.shortName}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* RA 10173 Applicant Privacy Notice & Branch Contacts */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white/95 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#464B71]">
          <ShieldCheck className="h-5 w-5 text-[#118AB2]" />
          <span>RA 10173 Applicant Data Privacy Notice</span>
        </div>
        <p className="text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
          In compliance with the Philippine Data Privacy Act of 2012 (RA 10173), Victorio Animal Bite Center never stores applicant resumes or personal identifiers in browser cookies or localStorage. To apply, contact your preferred branch directly or visit any of our 7 clinics listed on our{' '}
          <Link to="/contact" className="font-extrabold text-[#118AB2] underline">
            Branch Directory ({publicBranches.length} Locations)
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {publicBranches.map((b) => (
            <span
              key={b.slug}
              className="inline-flex items-center gap-1 rounded-lg bg-[#F2F2ED] px-2.5 py-1 text-xs font-bold text-[#464B71]"
            >
              <MapPin className="h-3 w-3 text-[#118AB2]" />
              <span>{b.shortName}: {b.contactNumber}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
