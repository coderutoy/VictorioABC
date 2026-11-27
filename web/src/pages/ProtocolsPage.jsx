import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Syringe,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ThermometerSnowflake,
  Baby,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const PROTOCOL_MATRIX = [
  {
    category: 'WHO Category I',
    findings: 'Touching/feeding animals, licks on intact skin (no skin break)',
    woundCare: 'Wash exposed skin with soap & running water for 15 minutes',
    vaccine: 'None required (if history is reliable)',
    rig: 'None required',
    tetanus: 'None required',
  },
  {
    category: 'WHO Category II',
    findings: 'Nibbling of uncovered skin, minor scratches/abrasions without bleeding',
    woundCare: '15-min soap & water flushing + povidone-iodine / 70% alcohol',
    vaccine: 'Start PEP immediately (Day 0, 3, 7, 14/28)',
    rig: 'Not required (unless immunocompromised)',
    tetanus: 'Tetanus Toxoid (TT 0.5 mL IM) per immunization history',
  },
  {
    category: 'WHO Category III',
    findings:
      'Transdermal bites/scratches with bleeding, saliva on broken skin/mucosa, head/neck/hand bites, or bat exposure',
    woundCare: '15-min soap & water flushing + antiseptic + avoid primary tight suturing',
    vaccine: 'Start PEP immediately (Day 0, 3, 7, 14/28)',
    rig: 'Immediate ERIG (40 IU/kg) or HRIG (20 IU/kg) wound infiltration',
    tetanus: 'TT (0.5 mL IM) + ATS / HTIG if indicated',
  },
];

export function ProtocolsPage() {
  const { selectedPublicBranch } = useBranch();
  const [weightKg, setWeightKg] = useState('60');
  const [igType, setIgType] = useState('ERIG');

  const calculatedIu = useMemo(() => {
    const w = Number(weightKg);
    if (!w || w <= 0) return 0;
    return Math.round(w * (igType === 'HRIG' ? 20 : 40));
  }, [weightKg, igType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Page Header */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <Stethoscope className="h-4 w-4" />
              <span>DOH &amp; WHO Clinical Standards</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Clinical Rabies, PEP, ERIG &amp; Tetanus Protocols
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Standardized clinical decision protocols enforced across all 7 Victorio Animal Bite Center branches.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/roadmap"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <span>Vaccination Roadmap</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/triage-guide"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white"
            >
              <span>First-Aid &amp; Triage Guide</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Clinical Decision Matrix Table */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm sm:p-8 space-y-5">
        <div>
          <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
            Physician Reference Matrix
          </span>
          <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
            WHO Category I–III Clinical Management Protocol
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#DDDCD4] text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#464B71] text-white">
                <th className="rounded-tl-xl px-4 py-3 font-extrabold">Category</th>
                <th className="px-4 py-3 font-extrabold">Clinical Findings</th>
                <th className="px-4 py-3 font-extrabold">Wound Management</th>
                <th className="px-4 py-3 font-extrabold">Anti-Rabies Vaccine</th>
                <th className="rounded-tr-xl px-4 py-3 font-extrabold">ERIG / HRIG &amp; Tetanus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDCD4] bg-white">
              {PROTOCOL_MATRIX.map((row) => (
                <tr key={row.category} className="hover:bg-[#F2F2ED]/60">
                  <td className="px-4 py-3.5 font-extrabold text-[#464B71]">{row.category}</td>
                  <td className="px-4 py-3.5 text-[#464B71]/90">{row.findings}</td>
                  <td className="px-4 py-3.5 text-[#464B71]/90">{row.woundCare}</td>
                  <td className="px-4 py-3.5 font-bold text-[#118AB2]">{row.vaccine}</td>
                  <td className="px-4 py-3.5 text-[#464B71]/90">
                    <div>
                      <strong>RIG:</strong> {row.rig}
                    </div>
                    <div className="mt-0.5 text-xs text-[#464B71]/75">
                      <strong>Tetanus:</strong> {row.tetanus}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Interactive ERIG / HRIG Weight-Based Dosage Reference Calculator */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="h-6 w-6 text-[#118AB2]" />
            <h2 className="text-lg font-extrabold text-[#464B71]">
              Category III ERIG / HRIG Dosage &amp; Infiltration Protocol
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
            Rabies Immunoglobulin (RIG) provides immediate passive neutralizing antibodies at the wound site during the initial 7–14 days before vaccine-induced active antibodies peak.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="proto-weight"
                className="block text-xs font-extrabold text-[#464B71]"
              >
                Patient Body Weight (kg)
              </label>
              <input
                id="proto-weight"
                type="number"
                min="1"
                max="200"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 text-sm font-extrabold text-[#464B71]"
              />
            </div>

            <div>
              <label
                htmlFor="proto-ig"
                className="block text-xs font-extrabold text-[#464B71]"
              >
                Immunoglobulin Preparation
              </label>
              <select
                id="proto-ig"
                value={igType}
                onChange={(e) => setIgType(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 text-xs font-extrabold text-[#464B71]"
              >
                <option value="ERIG">ERIG — Equine RIG (40 IU / kg)</option>
                <option value="HRIG">HRIG — Human RIG (20 IU / kg)</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#7CD5C7] bg-[#EAFBF8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                Calculated Maximum Dose ({igType === 'HRIG' ? '20 IU/kg' : '40 IU/kg'})
              </span>
              <p className="text-2xl font-extrabold text-[#464B71]">
                {calculatedIu.toLocaleString()} IU
              </p>
            </div>
            <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#464B71] ring-1 ring-[#DDDCD4]">
              Infiltrate directly into &amp; around all wounds
            </span>
          </div>
        </div>

        {/* 3. Cold Chain & Special Populations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#DDDCD4] bg-white/95 p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#464B71]">
              <ThermometerSnowflake className="h-5 w-5 text-[#118AB2]" />
              <span>FEFO Cold-Chain Vaccine Assurance (+2°C to +8°C)</span>
            </div>
            <p className="text-xs leading-relaxed text-[#464B71]/85">
              All WHO-prequalified PVRV/PCECV vials, ERIG, and Tetanus Toxoid batches at <strong>{selectedPublicBranch.shortName}</strong> are tracked by lot number and expiration date using strict First-Expired, First-Out (FEFO) automated inventory deduction.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDDCD4] bg-white/95 p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#464B71]">
              <Baby className="h-5 w-5 text-[#118AB2]" />
              <span>Pediatric, Pregnancy &amp; Breastfeeding Safety</span>
            </div>
            <p className="text-xs leading-relaxed text-[#464B71]/85">
              Because rabies is fatal once clinical symptoms manifest, there are <strong>no contraindications</strong> to Post-Exposure Prophylaxis. Cell-culture rabies vaccines and RIG are safe for infants, children, pregnant women, and nursing mothers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
