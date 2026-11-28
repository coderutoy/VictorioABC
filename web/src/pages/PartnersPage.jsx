import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Building2,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';

// 6 intentionally blank placeholder partner slots (zero fake company names or fake logos)
const BLANK_PARTNER_SLOTS = [1, 2, 3, 4, 5, 6];

const PARTNERSHIP_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'HMO & Healthcare Accreditation',
    detail:
      'Standardized WHO/DOH clinical protocols, electronic PRC physician sign-off, and itemized Animal Bite Registry billing records for accredited HMO and corporate health plans.',
  },
  {
    icon: Building2,
    title: 'LGU, Barangay & School Rabies Referral Network',
    detail:
      'Coordinated emergency bite referral pathways across Bulacan municipalities and North Caloocan barangays with 2.0°C–8.0°C cold-chain guaranteed vaccine supply.',
  },
  {
    icon: HeartHandshake,
    title: 'Corporate & Industrial Occupational Safety',
    detail:
      'Pre-Exposure Prophylaxis (PrEP) and rapid Post-Exposure Prophylaxis (PEP) coverage for field personnel, logistics fleets, veterinary clinics, and community responders.',
  },
];

export function PartnersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Institutional &amp; Healthcare Network</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Our Clinic &amp; Healthcare Partners
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Collaborating with local government units, healthcare institutions, HMOs, and community organizations across Bulacan and Metro Manila.
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-3 text-xs font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
          >
            <PhoneCall className="h-4 w-4 text-[#118AB2]" />
            <span>Inquire About Clinic Partnerships</span>
          </Link>
        </div>
      </div>

      {/* 6 Intentionally Blank Placeholder Partner Logo Cards */}
      <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-[#F2F2ED] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              Verified Partner Directory
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Official Partner Showcase
            </h2>
          </div>

          <p className="text-xs font-bold italic text-[#464B71]/70">
            Official partner logos coming soon
          </p>
        </div>

        <div
          data-testid="blank-partners-grid"
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {BLANK_PARTNER_SLOTS.map((slotNumber) => (
            <div
              key={slotNumber}
              aria-label={`Partner Showcase Slot ${slotNumber}`}
              className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed border-[#DDDCD4] bg-[#F2F2ED]/45 p-4 transition hover:border-[#118AB2]/40"
            >
              <div className="h-7 w-24 rounded-md border border-dashed border-[#464B71]/20 bg-white/60" />
            </div>
          ))}
        </div>
      </section>

      {/* Prospective HMO / LGU / Corporate Partnership Note */}
      <section className="grid gap-6 md:grid-cols-3">
        {PARTNERSHIP_PILLARS.map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 text-base font-extrabold text-[#464B71]">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/80 sm:text-sm">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-[#464B71] sm:text-lg">
            Interested in Partnering with Victorio Animal Bite Center?
          </h2>
          <p className="text-xs text-[#464B71]/80 sm:text-sm">
            Reach out to our clinic administration team for institutional MOAs, HMO accreditation, or community vaccination drives.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
        >
          <span>Contact Administration</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default PartnersPage;
