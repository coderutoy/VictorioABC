import { Link } from 'react-router-dom';
import {
  Droplets,
  Sparkles,
  Ban,
  MapPin,
  ShieldCheck,
  Syringe,
  HeartPulse,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { formatPhoneDisplay } from '../config/branches';
import { TandokWarningPopover } from '../components/public/TandokWarningPopover';

const FIRST_AID_INFOGRAPHIC = [
  {
    step: '1',
    title: 'Wash 15 Mins w/ Soap',
    caption:
      'Immediately flush the bite or scratch wound under strong running tap water with soap for at least 15 full minutes.',
    icon: Droplets,
    accent: 'bg-[#118AB2] text-white',
    ring: 'border-[#118AB2]/30',
  },
  {
    step: '2',
    title: 'Apply Antiseptic',
    caption:
      'Gently apply povidone-iodine (Betadine) or 70% ethyl/isopropyl alcohol to disinfect the wound site.',
    icon: Sparkles,
    accent: 'bg-[#7CD5C7] text-[#464B71]',
    ring: 'border-[#7CD5C7]',
  },
  {
    step: '3',
    title: 'Never Use Tandok',
    caption:
      'Never use horn suction (tandok), garlic, vinegar, or tight bandages—these push virus deeper into nerves.',
    icon: Ban,
    accent: 'bg-red-600 text-white',
    ring: 'border-red-300',
    hasTandokWarning: true,
  },
  {
    step: '4',
    title: 'Visit Nearest Branch',
    caption:
      'Proceed immediately to any of our 7 Victorio ABC branches for physician WHO Category I–III evaluation.',
    icon: MapPin,
    accent: 'bg-[#464B71] text-[#7CD5C7]',
    ring: 'border-[#464B71]/30',
  },
];

const WHO_INFOGRAPHIC = [
  {
    cat: 'Category I',
    level: 'No Exposure',
    actionBadge: 'Wash Only',
    badgeColor: 'bg-emerald-600 text-white',
    cardBorder: 'border-emerald-300 bg-emerald-50/85',
    iconColor: 'text-emerald-700 bg-emerald-100',
    icon: ShieldCheck,
    examples: [
      'Touching or feeding domestic pets',
      'Animal licks on intact unbroken skin',
      'No skin scratch, abrasion, or mucous contact',
    ],
    management:
      'Wash exposed skin thoroughly with soap and running water for 15 minutes. No vaccine or RIG required unless clinically indicated by physician.',
  },
  {
    cat: 'Category II',
    level: 'Superficial Exposure',
    actionBadge: 'Vaccine (PEP)',
    badgeColor: 'bg-amber-600 text-white',
    cardBorder: 'border-amber-300 bg-amber-50/85',
    iconColor: 'text-amber-700 bg-amber-100',
    icon: Syringe,
    examples: [
      'Minor scratch or superficial abrasion',
      'Nibbling of uncovered skin',
      'No spontaneous or active bleeding',
    ],
    management:
      'Immediate 15-minute wound washing + Start Anti-Rabies Vaccine PEP schedule immediately (Day 0, Day 3, Day 7, Day 14/28).',
  },
  {
    cat: 'Category III',
    level: 'Transdermal / Severe',
    actionBadge: 'Vaccine + ERIG/HRIG',
    badgeColor: 'bg-red-600 text-white',
    cardBorder: 'border-red-300 bg-red-50/85',
    iconColor: 'text-red-700 bg-red-100',
    icon: HeartPulse,
    examples: [
      'Single or multiple transdermal bites or scratches with bleeding',
      'Licks on broken skin or mucous membranes (eyes, mouth, nose)',
      'Any bite on head, face, neck, hands/fingers, or any bat exposure',
    ],
    management:
      'Immediate 15-minute wound washing + Start Anti-Rabies Vaccine PEP schedule + Immediate ERIG/HRIG wound infiltration + Tetanus prophylaxis.',
  },
];

export function TriageGuidePage() {
  const { selectedPublicBranch } = useBranch();
  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Page Header */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <ShieldCheck className="h-4 w-4" />
              <span>Emergency First-Aid &amp; WHO Classification</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Animal Bite First-Aid &amp; WHO Category Guide
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Follow the 4-step immediate washing protocol and review how licensed Victorio ABC physicians classify animal bite exposures into WHO Categories I, II, and III.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/roadmap"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <span>Day 0–28 Roadmap</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/protocols"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white"
            >
              <span>Clinical Protocols</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 1. 4-Step Immediate Emergency First-Aid Infographic + Compact Tandok Warning Icon Popover */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                Do This Immediately
              </span>
              {/* Compact Hover / Tap Public Health Warning Icon Trigger */}
              <TandokWarningPopover align="left" />
            </div>
            <h2 className="text-xl font-extrabold text-[#464B71] sm:text-2xl">
              4-Step Immediate Animal Bite First-Aid
            </h2>
          </div>

          <a
            href={`tel:${selectedPublicBranch.contactNumber}`}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>
              Call {selectedPublicBranch.shortName}: {formattedPhone}
            </span>
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FIRST_AID_INFOGRAPHIC.map(({ step, title, caption, icon: Icon, accent, ring }) => (
            <div
              key={step}
              className={`flex flex-col items-center rounded-2xl border-2 bg-[#F2F2ED]/75 p-5 text-center ${ring}`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${accent}`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <span className="mt-3 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#464B71] ring-1 ring-[#DDDCD4]">
                Step {step}
              </span>
              <h3 className="mt-2 text-base font-extrabold text-[#464B71]">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/85">{caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. WHO Exposure Category I / II / III Visual Educational Reference */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div>
          <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
            WHO Classification Matrix
          </span>
          <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
            WHO Rabies Exposure Categories I, II, and III
          </h2>
          <p className="mt-1 text-xs text-[#464B71]/80 sm:text-sm">
            Educational overview of World Health Organization (WHO) exposure categories evaluated by our clinic physicians during in-person consultation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {WHO_INFOGRAPHIC.map(
            ({
              cat,
              level,
              actionBadge,
              badgeColor,
              cardBorder,
              iconColor,
              icon: Icon,
              examples,
              management,
            }) => (
              <div
                key={cat}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm ${cardBorder}`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#464B71]">{cat}</h3>
                      <p className="text-xs font-semibold text-[#464B71]/75">{level}</p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs font-semibold text-[#464B71]">
                    {examples.map((ex) => (
                      <li key={ex} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#464B71]" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 border-t border-black/10 pt-3 text-xs leading-relaxed text-[#464B71]/90">
                    <strong>Clinical Protocol:</strong> {management}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#464B71]/75">
                    Required Action
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${badgeColor}`}
                  >
                    {actionBadge}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. Static Mobile App & Walk-In Consultation Note (No Interactive Triage or AI Scanner on Web) */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7CD5C7]/35 text-[#464B71]">
            <Smartphone className="h-6 w-6 text-[#118AB2]" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              In-Clinic Evaluation &amp; Mobile Companion
            </span>
            <h2 className="text-base font-extrabold text-[#464B71] sm:text-lg">
              Visit {selectedPublicBranch.shortName} for Official Physician Evaluation
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-[#464B71]/80 sm:text-sm">
              Every animal bite or scratch requires an in-person clinical evaluation by a licensed physician. Registered patients can also access their Digital QR Vaccination Pass, dose reminders, and mobile pre-triage companion inside the <strong>Victorio ABC Mobile App</strong>.
            </p>
          </div>
        </div>

        <Link
          to="/contact"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
        >
          <span>Find Nearest Branch</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
