import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  Sparkles,
  Ban,
  MapPin,
  ShieldCheck,
  Syringe,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

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
  const [animal, setAnimal] = useState('dog');
  const [exposure, setExposure] = useState('transdermal_bleeding');

  const estimatedCategory =
    animal === 'bat' || exposure === 'transdermal_bleeding' || exposure === 'mucosa_broken'
      ? 'III'
      : exposure === 'intact_skin'
        ? 'I'
        : 'II';

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
              Animal Bite Triage &amp; First-Aid Guide
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Follow the 4-step immediate washing protocol and review how physicians classify exposures into WHO Categories I, II, and III.
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

      {/* 1. 4-Step Immediate Emergency First-Aid Infographic (Migrated from Homepage) */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              Do This Immediately
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              4-Step Immediate Animal Bite First-Aid
            </h2>
          </div>
          <a
            href={`tel:${selectedPublicBranch.contactNumber}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Call {selectedPublicBranch.shortName}: {selectedPublicBranch.contactNumber}</span>
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

        {/* Anti-Tandok Warning */}
        <div className="rounded-2xl border-2 border-red-300 bg-red-50/95 p-4 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div className="text-xs leading-relaxed sm:text-sm">
              <p className="font-extrabold uppercase tracking-wide text-red-700">
                Public Health Warning: Never Use &ldquo;Tandok&rdquo;, Garlic, or Vinegar
              </p>
              <p className="mt-1">
                Traditional horn suction (<em>tandok</em>) or rubbing garlic, vinegar, or herbs onto bite wounds <strong>cannot remove or kill the rabies virus</strong>. It damages tissue, introduces tetanus spores, and causes dangerous delays in receiving life-saving Anti-Rabies Vaccine and ERIG.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WHO Exposure Category I / II / III Visual Infographic (Migrated from Homepage) */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div>
          <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
            WHO Classification Matrix
          </span>
          <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
            WHO Rabies Exposure Categories I, II, and III
          </h2>
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

      {/* 3. Interactive Self-Check Advisory Estimator */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-5">
        <div>
          <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
            Interactive Pre-Triage Helper
          </span>
          <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71]">
            Quick Advisory WHO Category Check
          </h2>
          <p className="text-xs text-[#464B71]/75">
            For educational reference only — all animal bite exposures require in-person verification by a licensed Victorio ABC physician.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-extrabold text-[#464B71]">
              1. Biting or Scratching Animal
            </label>
            <select
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2.5 text-xs font-bold text-[#464B71]"
            >
              <option value="dog">Dog (Pet or Stray)</option>
              <option value="cat">Cat (Pet or Stray)</option>
              <option value="bat">Bat or Wild Mammal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#464B71]">
              2. Type of Contact or Wound
            </label>
            <select
              value={exposure}
              onChange={(e) => setExposure(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2.5 text-xs font-bold text-[#464B71]"
            >
              <option value="transdermal_bleeding">
                Bite or Scratch with Bleeding / Deep Puncture
              </option>
              <option value="mucosa_broken">
                Lick or Saliva on Broken Skin / Eyes / Mouth / Head / Hand
              </option>
              <option value="minor_scratch_no_bleed">
                Minor Superficial Scratch or Nibbling Without Bleeding
              </option>
              <option value="intact_skin">
                Touching / Feeding or Lick on Completely Intact Unbroken Skin
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#118AB2] bg-[#EAFBF8] p-5 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Advisory Triage Estimate
            </span>
            <p className="mt-0.5 text-lg font-extrabold text-[#464B71]">
              WHO Category {estimatedCategory} Exposure
            </p>
            <p className="mt-1 text-xs text-[#464B71]/85">
              {estimatedCategory === 'III'
                ? 'Requires immediate 15-minute soap washing, Day 0 Anti-Rabies Vaccine PEP, and ERIG/HRIG wound infiltration.'
                : estimatedCategory === 'II'
                  ? 'Requires immediate 15-minute soap washing and Day 0 Anti-Rabies Vaccine PEP initiation.'
                  : 'Intact skin contact (Category I). Wash thoroughly with soap and water and consult a physician if uncertain.'}
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white"
          >
            <span>Visit {selectedPublicBranch.shortName}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
