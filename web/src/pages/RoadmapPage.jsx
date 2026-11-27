import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  QrCode,
  Syringe,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  AlertCircle,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const PEP_TIMELINE = [
  {
    day: 'Day 0',
    offset: 0,
    title: 'First Visit & Initiation',
    tag: 'ARV + ERIG / TT',
    detail:
      'Wound washing, physician WHO Category I–III classification, Day 0 Anti-Rabies Vaccine, Category III ERIG/HRIG infiltration, Tetanus Toxoid, and Digital QR Pass issuance.',
    highlight: 'bg-[#118AB2] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 3',
    offset: 3,
    title: 'Second PEP Dose',
    tag: 'ID / IM / Booster',
    detail:
      'Essential early immune response dose. Required for all regimens (Intradermal, Intramuscular, and 2-dose Repeat Exposure Booster). Eligible at any of our 7 branches via QR Pass.',
    highlight: 'bg-[#464B71] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 7',
    offset: 7,
    title: 'Third PEP Dose',
    tag: 'ID & IM Regimens',
    detail:
      'Accelerates neutralizing rabies antibody production across all primary ID and IM post-exposure regimens.',
    highlight: 'bg-[#464B71] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 14',
    offset: 14,
    title: 'Fourth PEP Dose (IM) & Animal Check',
    tag: 'IM Essen + 14-Day Check',
    detail:
      'Administered for the 5-dose Intramuscular (Essen) regimen and marks completion of the 14-day domestic biting animal observation period.',
    highlight: 'bg-white text-[#464B71] ring-[#DDDCD4]',
  },
  {
    day: 'Day 28',
    offset: 28,
    title: 'Final Completion Dose',
    tag: 'Full Protection & Certificate',
    detail:
      'Completes the full WHO Post-Exposure Prophylaxis schedule and unlocks your official Victorio ABC Rabies Vaccination Completion Certificate.',
    highlight: 'bg-[#7CD5C7] text-[#464B71] ring-[#464B71]',
  },
];

const REGIMEN_CARDS = [
  {
    id: 'ID',
    name: 'Updated Thai Red Cross Intradermal (ID)',
    doses: '4 Clinic Visits (Day 0, Day 3, Day 7, Day 28)',
    route: '0.1 mL ID at two sites (both deltoids) per visit',
    offsets: [0, 3, 7, 28],
  },
  {
    id: 'IM',
    name: 'Essen 5-Dose Intramuscular (IM)',
    doses: '5 Clinic Visits (Day 0, Day 3, Day 7, Day 14, Day 28)',
    route: '1 full vial IM in deltoid muscle per visit',
    offsets: [0, 3, 7, 14, 28],
  },
  {
    id: 'booster',
    name: 'Repeat Exposure Booster Regimen',
    doses: '2 Clinic Visits (Day 0 & Day 3)',
    route: 'For patients with documented prior complete PEP/PrEP; no ERIG required',
    offsets: [0, 3],
  },
];

function addDaysIso(baseDateStr, days) {
  if (!baseDateStr) return '';
  const [y, m, d] = baseDateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function RoadmapPage() {
  const { selectedPublicBranch } = useBranch();
  const [day0Date, setDay0Date] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedRegimen, setSelectedRegimen] = useState('ID');

  const activeRegimen = useMemo(
    () => REGIMEN_CARDS.find((r) => r.id === selectedRegimen) || REGIMEN_CARDS[0],
    [selectedRegimen]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <CalendarClock className="h-4 w-4" />
              <span>Vaccination Journey &amp; Dose Timeline</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              PEP Vaccination Roadmap (Day 0 to Day 28)
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Track every milestone of your WHO-aligned Anti-Rabies Post-Exposure Prophylaxis schedule across all 7 Victorio ABC branches.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/triage-guide"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <span>WHO Triage Guide</span>
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

      {/* Visual 5-Milestone PEP Timeline Infographic (Migrated from Homepage) */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              Visual Dose Stepper
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Standard PEP Vaccination Schedule Timeline
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#464B71] px-3.5 py-1.5 text-xs font-bold text-[#7CD5C7]">
            <QrCode className="h-4 w-4" />
            <span>Cross-Branch QR Pass Enabled</span>
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {PEP_TIMELINE.map((item) => {
            const isIncluded = activeRegimen.offsets.includes(item.offset);
            const targetDate = addDaysIso(day0Date, item.offset);
            return (
              <div
                key={item.day}
                className={`flex flex-col justify-between rounded-2xl border-2 p-4 transition ${
                  isIncluded
                    ? 'border-[#118AB2] bg-[#F2F2ED]/80 shadow-sm'
                    : 'border-[#DDDCD4] bg-[#F2F2ED]/30 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-xs font-extrabold ring-2 ${item.highlight}`}
                    >
                      {item.day}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-[#118AB2] ring-1 ring-[#DDDCD4]">
                      {isIncluded ? targetDate : 'Optional (IM)'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-extrabold text-[#464B71]">{item.title}</h3>
                  <p className="mt-1 inline-block rounded-md bg-[#7CD5C7]/35 px-2 py-0.5 text-[10px] font-bold text-[#464B71]">
                    {item.tag}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#464B71]/85">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive PEP Date Calculator & Regimen Selector */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Interactive Dose Planner
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Preview Your PEP Schedule Dates
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="roadmap-day0" className="text-xs font-extrabold text-[#464B71]">
              Day 0 Start Date:
            </label>
            <input
              id="roadmap-day0"
              type="date"
              value={day0Date}
              onChange={(e) => setDay0Date(e.target.value)}
              className="min-h-[44px] rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 text-xs font-extrabold text-[#464B71] focus:border-[#118AB2] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REGIMEN_CARDS.map((reg) => {
            const isSelected = reg.id === selectedRegimen;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegimen(reg.id)}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition ${
                  isSelected
                    ? 'border-[#118AB2] bg-[#EAFBF8] ring-2 ring-[#7CD5C7]'
                    : 'border-[#DDDCD4] bg-white hover:bg-[#F2F2ED]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Syringe className="h-5 w-5 text-[#118AB2]" />
                    {isSelected && (
                      <span className="rounded-full bg-[#118AB2] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        Selected Preview
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-[#464B71]">{reg.name}</h3>
                  <p className="mt-1 text-xs font-bold text-[#118AB2]">{reg.doses}</p>
                  <p className="mt-1.5 text-xs text-[#464B71]/80">{reg.route}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#DDDCD4] pt-3">
                  {reg.offsets.map((off) => (
                    <span
                      key={off}
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-extrabold text-[#464B71] ring-1 ring-[#DDDCD4]"
                    >
                      Day {off}: {addDaysIso(day0Date, off)}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-Branch Continuity & Missed Dose Advice */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#DDDCD4] bg-white/95 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#464B71]">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Cross-Branch Follow-Up Doses Across All 7 Clinics</span>
          </div>
          <p className="text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
            Started your Day 0 dose at <strong>{selectedPublicBranch.shortName}</strong>? You can present your Digital QR Pass at any of our 7 branches in Baliwag, Santa Maria, Pandi, DRT, Meycauayan (Camalig &amp; Poblacion), or Cefels Caloocan for your Day 3, Day 7, Day 14, or Day 28 dose.
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDDCD4] bg-white/95 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#464B71]">
            <AlertCircle className="h-5 w-5 text-[#118AB2]" />
            <span>What If I Miss or Delay a Scheduled Dose?</span>
          </div>
          <p className="text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
            Do not panic and do not delay further — visit the nearest Victorio ABC branch right away. Our physician and triage nurse will adjust your remaining schedule dates without restarting from Day 0 in most short delays.
          </p>
          <div className="pt-1">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white"
            >
              <PhoneCall className="h-4 w-4" />
              <span>
                Call {selectedPublicBranch.shortName} (
                {selectedPublicBranch.displayPhone || selectedPublicBranch.contactNumber})
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
