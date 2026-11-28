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
  Award,
  CalendarClock,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const WHO_BITE_CATEGORIES = [
  {
    category: 'Category I',
    riskLevel: 'No Exposure / Intact Skin',
    badgeClass: 'bg-sky-600 text-white',
    borderClass: 'border-sky-500/50',
    criteria:
      'Touching or feeding animals, licks on intact skin, or casual contact with no skin breach or mucosal exposure.',
    protocol:
      'Immediate 15-minute soap-and-water washing. No anti-rabies vaccine or RIG required once intact skin is verified by a physician.',
  },
  {
    category: 'Category II',
    riskLevel: 'Moderate Exposure • Vaccine Required',
    badgeClass: 'bg-amber-600 text-white',
    borderClass: 'border-amber-500/60',
    criteria:
      'Nibbling of uncovered skin, minor scratches or superficial abrasions without spontaneous bleeding.',
    protocol:
      'Immediate wound washing + full Post-Exposure Prophylaxis (PEP) PVRV/PCECV schedule (Days 0, 3, 7, 14, and 28).',
  },
  {
    category: 'Category III',
    riskLevel: 'Severe Exposure • Vaccine + ERIG/HRIG',
    badgeClass: 'bg-red-600 text-white',
    borderClass: 'border-red-500/70',
    criteria:
      'Single or multiple transdermal bites or scratches with bleeding, licks on broken skin/mucous membranes, or any head, neck, face, or hand bite.',
    protocol:
      'Immediate 15-minute wound irrigation + Weight-Based ERIG (40 IU/kg) or HRIG (20 IU/kg) wound infiltration + full Day 0–28 PEP & Tetanus prophylaxis.',
  },
];

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
      'Repeat Exposure 2-Dose Booster Regimen (Day 0 & Day 3) for patients who completed PEP within the last 3 months.',
      'Cold-chain monitored WHO-prequalified cell-culture vaccines (Verorab & Speeda PVRV).',
    ],
  },
  {
    title: 'ERIG / HRIG Wound Infiltration (WHO Category III)',
    badge: '40 IU/kg ERIG • 20 IU/kg HRIG',
    icon: HeartPulse,
    summary:
      'Immediate passive rabies antibodies infiltrated directly into deep, bleeding, or cranial/hand wounds.',
    bullets: [
      'Indicated for all WHO Category III exposures (transdermal bites, bleeding scratches, mucous membrane contamination, or head/neck/face/hand bites).',
      'Precision weight-calibrated dosage computation (40 IU/kg for Equine RIG; 20 IU/kg for Human RIG).',
      'Mandatory skin testing and 30-minute post-infiltration clinical observation.',
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
      'Thorough povidone-iodine irrigation and non-suturing management to prevent viral trapping.',
      'Structured 14-day domestic animal observation guidance and official vaccination certificates.',
    ],
  },
  {
    title: 'PhilHealth Animal Bite Treatment Package (ABTP) & PrEP',
    badge: 'PhilHealth ABTP • Pre-Exposure',
    icon: Award,
    summary:
      'DOH-certified Animal Bite Treatment Center documentation and proactive Pre-Exposure immunization.',
    bullets: [
      'Electronic PRC physician sign-off and official Animal Bite Registry records supporting eligible PhilHealth ABTP benefit claims.',
      'Pre-Exposure Prophylaxis (PrEP) for pet owners, veterinary staff, delivery riders, and children.',
      'Cross-branch digital vaccination card continuity across all 7 Victorio ABC clinics.',
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
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              DOH &amp; WHO Clinical Protocols
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Clinical Services &amp; WHO Exposure Category Guide
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Available daily across all 7 Victorio ABC branches. Currently viewing protocols for{' '}
              <strong className="text-[#7CD5C7]">{selectedPublicBranch.shortName}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>
                Call {selectedPublicBranch.displayPhone || selectedPublicBranch.contactNumber}
              </span>
            </a>
            <Link
              to="/branches"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white"
            >
              <span>All 7 Clinic Branches</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* WHO/DOH Animal Bite Exposure Categories (Category I, II, III) */}
      <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              WHO / DOH Triage Classification
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Animal Bite Exposure Categories (Category I, II &amp; III)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/triage-guide"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>First-Aid &amp; Triage Guide</span>
            </Link>
            <Link
              to="/roadmap"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <CalendarClock className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Day 0–28 PEP Roadmap</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {WHO_BITE_CATEGORIES.map((item) => (
            <div
              key={item.category}
              className={`flex flex-col justify-between rounded-2xl border-2 bg-[#F2F2ED]/60 p-5 ${item.borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold text-[#464B71]">
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${item.badgeClass}`}
                  >
                    {item.riskLevel}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#464B71]/90">
                  <strong className="font-extrabold">Exposure Criteria:</strong>{' '}
                  {item.criteria}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-[#DDDCD4] bg-white p-3 text-xs">
                <p className="font-extrabold text-[#118AB2]">
                  DOH / WHO Management Protocol:
                </p>
                <p className="mt-1 leading-relaxed text-[#464B71]/85">
                  {item.protocol}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

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

export default ServicesPage;
