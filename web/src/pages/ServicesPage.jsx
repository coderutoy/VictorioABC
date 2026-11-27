import { Link } from 'react-router-dom';
import {
  Syringe,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  ClipboardList,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const DETAILED_SERVICES = [
  {
    title: 'Post-Exposure Prophylaxis (PEP)',
    badge: 'Day 0 • Day 3 • Day 7 • Day 14/28',
    icon: Syringe,
    summary:
      'Immediate anti-rabies vaccination series following a dog, cat, or mammal bite or scratch.',
    bullets: [
      'Updated Thai Red Cross Intradermal (ID) Regimen: Day 0, Day 3, Day 7, and Day 28.',
      'Essen 5-Dose Intramuscular (IM) Regimen: Day 0, Day 3, Day 7, Day 14, and Day 28.',
      'Repeat Exposure 2-Dose Booster Regimen (Day 0 & Day 3) for previously immunized patients.',
      'Cold-chain monitored WHO-prequalified cell-culture vaccines (PVRV / PCECV).',
    ],
  },
  {
    title: 'ERIG / HRIG Wound Infiltration (WHO Category III)',
    badge: '40 IU/kg ERIG • 20 IU/kg HRIG',
    icon: HeartPulse,
    summary:
      'Immediate passive rabies antibodies infiltrated directly into deep, bleeding, or multiple transdermal wounds.',
    bullets: [
      'Indicated for all WHO Category III exposures (transdermal bites, bleeding scratches, mucous membrane contamination, head/neck/hand bites, or bat exposures).',
      'Weight-calibrated dosage computation (40 IU/kg for Equine RIG; 20 IU/kg for Human RIG).',
      'Mandatory skin testing and 30-minute post-infiltration clinical observation.',
    ],
  },
  {
    title: 'Pre-Exposure Prophylaxis (PrEP)',
    badge: 'Preventive Immunization',
    icon: ShieldCheck,
    summary:
      'Proactive rabies protection prior to any animal exposure for high-risk individuals and families.',
    bullets: [
      'Recommended for pet owners, animal handlers, veterinary staff, delivery riders, and children.',
      'Eliminates the need for costly ERIG/HRIG infiltration if bitten in the future.',
      'Simplifies any future exposure treatment to a fast 2-dose booster (Day 0 & Day 3).',
    ],
  },
  {
    title: 'Tetanus Prophylaxis & Medical Wound Management',
    badge: 'TT • ATS • Wound Care',
    icon: Stethoscope,
    summary:
      'Comprehensive bacterial & tetanus infection prevention alongside rabies care.',
    bullets: [
      'Tetanus Toxoid (TT 0.5 mL IM) and Anti-Tetanus Serum (ATS) / Human Tetanus Immunoglobulin (HTIG).',
      'Thorough antiseptic wound irrigation and non-suturing management to prevent viral trapping.',
      'Structured 14-day domestic animal observation guidance and official vaccination certificates.',
    ],
  },
];

const WHAT_TO_BRING = [
  'Valid government ID, school ID, or PhilHealth ID (if available) for encrypted patient registry.',
  'Previous Anti-Rabies Vaccination card or Digital QR Pass if you have received PEP/PrEP in the past.',
  'Patient weight (taken at triage) and list of any known medication or serum allergies.',
  'Information about the biting animal (owned vs. stray, vaccination status, and date/time of exposure).',
];

export function ServicesPage() {
  const { selectedPublicBranch } = useBranch();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              DOH &amp; WHO Clinical Protocols
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Our Clinical Rabies &amp; Animal Bite Services
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Available daily across all 7 Victorio ABC branches. Currently viewing protocols for{' '}
              <strong className="text-[#7CD5C7]">{selectedPublicBranch.shortName}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {selectedPublicBranch.contactNumber}</span>
            </a>
            <Link
              to="/contact"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white"
            >
              <span>Find Nearest Branch</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Service Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {DETAILED_SERVICES.map(({ title, badge, icon: Icon, summary, bullets }) => (
          <div
            key={title}
            className="flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold text-[#464B71]">
                  {badge}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-extrabold text-[#464B71]">{title}</h2>
              <p className="mt-1.5 text-xs font-medium text-[#464B71]/80 sm:text-sm">
                {summary}
              </p>

              <ul className="mt-4 space-y-2 border-t border-[#F2F2ED] pt-4 text-xs text-[#464B71] sm:text-sm">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* What to Bring Checklist */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="h-6 w-6 text-[#118AB2]" />
          <h2 className="text-xl font-extrabold text-[#464B71]">
            What to Bring to Your Clinic Visit
          </h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {WHAT_TO_BRING.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2.5 rounded-xl bg-[#F2F2ED]/70 p-3.5 text-xs font-semibold text-[#464B71] sm:text-sm"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
