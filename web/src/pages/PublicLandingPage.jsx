import { Link } from 'react-router-dom';
import {
  Droplets,
  Sparkles,
  Ban,
  MapPin,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Syringe,
  HeartPulse,
  QrCode,
  ArrowRight,
  Building2,
  HelpCircle,
  Stethoscope,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

const FIRST_AID_INFOGRAPHIC = [
  {
    step: '1',
    title: 'Wash 15 Mins w/ Soap',
    caption: 'Flush wound under strong running tap water with soap.',
    icon: Droplets,
    accent: 'bg-[#118AB2] text-white',
    ring: 'border-[#118AB2]/30',
  },
  {
    step: '2',
    title: 'Apply Antiseptic',
    caption: 'Dab povidone-iodine or 70% alcohol on exposure site.',
    icon: Sparkles,
    accent: 'bg-[#7CD5C7] text-[#464B71]',
    ring: 'border-[#7CD5C7]',
  },
  {
    step: '3',
    title: 'Never Use Tandok',
    caption: 'No horn suction, garlic, vinegar, or tight bandages.',
    icon: Ban,
    accent: 'bg-red-600 text-white',
    ring: 'border-red-300',
  },
  {
    step: '4',
    title: 'Visit Nearest Branch',
    caption: 'Get Day 0 Anti-Rabies Vaccine & ERIG assessment today.',
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
    cardBorder: 'border-emerald-300 bg-emerald-50/70',
    iconColor: 'text-emerald-700 bg-emerald-100',
    icon: ShieldCheck,
    examples: ['Touching or feeding pets', 'Licks on intact unbroken skin', 'No skin scratch or break'],
  },
  {
    cat: 'Category II',
    level: 'Superficial Exposure',
    actionBadge: 'Vaccine',
    badgeColor: 'bg-amber-600 text-white',
    cardBorder: 'border-amber-300 bg-amber-50/70',
    iconColor: 'text-amber-700 bg-amber-100',
    icon: Syringe,
    examples: ['Minor scratch or abrasion', 'Nibbling of uncovered skin', 'No active bleeding'],
  },
  {
    cat: 'Category III',
    level: 'Transdermal / Severe',
    actionBadge: 'Vaccine + ERIG/HRIG',
    badgeColor: 'bg-red-600 text-white',
    cardBorder: 'border-red-300 bg-red-50/70',
    iconColor: 'text-red-700 bg-red-100',
    icon: HeartPulse,
    examples: ['Deep or bleeding bite/scratch', 'Saliva on broken skin/mucosa', 'Head/neck/hand or bat bites'],
  },
];

const PEP_TIMELINE = [
  {
    day: 'Day 0',
    title: 'First Dose',
    tag: 'ARV + ERIG / TT',
    highlight: 'bg-[#118AB2] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 3',
    title: '2nd Dose',
    tag: 'ID / IM / Booster',
    highlight: 'bg-[#464B71] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 7',
    title: '3rd Dose',
    tag: 'ID & IM Regimens',
    highlight: 'bg-[#464B71] text-white ring-[#7CD5C7]',
  },
  {
    day: 'Day 14',
    title: '4th Dose',
    tag: 'IM Essen Regimen',
    highlight: 'bg-white text-[#464B71] ring-[#DDDCD4]',
  },
  {
    day: 'Day 28',
    title: 'Final Dose',
    tag: 'Full Protection',
    highlight: 'bg-[#7CD5C7] text-[#464B71] ring-[#464B71]',
  },
];

const HIGHLIGHT_TILES = [
  {
    title: '7 Branches Across Bulacan & Caloocan',
    caption: 'Baliwag • Santa Maria • Pandi • DRT • Meycauayan (2) • Caloocan',
    icon: Building2,
    to: '/contact',
    cta: 'Find Branch',
  },
  {
    title: 'DOH / WHO-Aligned Protocols',
    caption: 'Certified PEP, PrEP, ERIG/HRIG infiltration & Tetanus prophylaxis',
    icon: Stethoscope,
    to: '/services',
    cta: 'Our Services',
  },
  {
    title: 'Digital QR Check-In & Tracking',
    caption: 'Cross-branch digital patient pass & AES-256-GCM encrypted EMR',
    icon: QrCode,
    to: '/about',
    cta: 'How It Works',
  },
];

export function PublicLandingPage() {
  const { isAuthenticated } = useAuth();
  const { selectedPublicBranch } = useBranch();

  const portalPath = isAuthenticated
    ? '/dashboard'
    : `/login?branch=${encodeURIComponent(selectedPublicBranch.slug)}`;

  return (
    <div className="space-y-12 pb-14">
      {/* 1. Compact Hero Banner with Active Branch Quick-Strip */}
      <section className="bg-[#464B71] py-10 text-white sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <ShieldCheck className="h-4 w-4" />
                <span>7 Official Branches • Bulacan &amp; Metro Manila</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Immediate, WHO-Guided{' '}
                <span className="text-[#7CD5C7]">Animal Bite &amp; Rabies Care</span>
              </h1>

              <p className="max-w-xl text-sm text-white/85 sm:text-base">
                Walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), Category III ERIG/HRIG wound infiltration, and cross-branch Digital QR Pass tracking.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={portalPath}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E]"
                >
                  <span>{isAuthenticated ? 'Open Clinical Portal' : 'Portal Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-6 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
                >
                  <Syringe className="h-4 w-4" />
                  <span>View Our Services</span>
                </Link>
              </div>
            </div>

            {/* Active Branch Quick-Strip Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-2 border-[#7CD5C7] bg-white p-5 text-[#464B71] shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-[#F2F2ED] pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/victorio_logo.jpg"
                      alt="Victorio ABC Emblem"
                      className="h-11 w-11 rounded-full border-2 border-[#118AB2] object-cover"
                    />
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                        Active Branch Context
                      </span>
                      <h2 className="text-base font-extrabold text-[#464B71]">
                        {selectedPublicBranch.shortName}
                      </h2>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="rounded-lg bg-[#F2F2ED] px-2.5 py-1 text-[11px] font-bold text-[#464B71] hover:bg-[#DDDCD4]"
                  >
                    All 7 &rarr;
                  </Link>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span className="font-semibold text-[#464B71]">
                      {selectedPublicBranch.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-[#464B71]/80">{selectedPublicBranch.hours}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedPublicBranch.contactNumber}`}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Call {selectedPublicBranch.contactNumber}</span>
                  </a>
                  <a
                    href={selectedPublicBranch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#DDDCD4]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#118AB2]" />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual 4-Step Emergency First-Aid Infographic */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                Emergency Bite Protocol
              </span>
              <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
                4-Step Immediate Animal Bite First-Aid
              </h2>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#118AB2] hover:underline"
            >
              <span>First-Aid FAQ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIRST_AID_INFOGRAPHIC.map(({ step, title, caption, icon: Icon, accent, ring }) => (
              <div
                key={step}
                className={`relative flex flex-col items-center rounded-2xl border-2 bg-[#F2F2ED]/60 p-5 text-center ${ring}`}
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
                <p className="mt-1 text-xs text-[#464B71]/80">{caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHO Exposure Category I / II / III Visual Infographic */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Clinical Triage Guide
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              WHO Rabies Exposure Categories at a Glance
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#118AB2] hover:underline"
          >
            <span>Detailed Treatment Protocols</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
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
            }) => (
              <div
                key={cat}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm ${cardBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#464B71]">{cat}</h3>
                        <p className="text-xs font-semibold text-[#464B71]/75">{level}</p>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs font-semibold text-[#464B71]">
                    {examples.map((ex) => (
                      <li key={ex} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#464B71]" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-3">
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
      </section>

      {/* 4. PEP Vaccination Schedule Timeline Infographic */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#DDDCD4] bg-[#464B71] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded-full bg-[#7CD5C7]/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
                Vaccination Roadmap
              </span>
              <h2 className="mt-1.5 text-xl font-extrabold text-white sm:text-2xl">
                Standard PEP Vaccination Schedule Timeline
              </h2>
            </div>
            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-[#7CD5C7]">
              Cross-Branch QR Pass Enabled
            </span>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-5">
            {PEP_TIMELINE.map((item, idx) => (
              <div
                key={item.day}
                className="relative flex flex-col items-center rounded-2xl border border-white/15 bg-[#343857] p-4 text-center"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-xs font-extrabold ring-2 ${item.highlight}`}
                >
                  {item.day}
                </div>
                <p className="mt-2.5 text-sm font-extrabold text-white">{item.title}</p>
                <span className="mt-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7CD5C7]">
                  {item.tag}
                </span>
                {idx < PEP_TIMELINE.length - 1 && (
                  <ArrowRight className="mt-2 hidden h-4 w-4 text-[#7CD5C7]/70 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Quick Visual Strip & Dedicated Page Links */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {HIGHLIGHT_TILES.map(({ title, caption, icon: Icon, to, cta }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white p-5 shadow-sm transition hover:border-[#118AB2] hover:shadow-md"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7CD5C7]/35 text-[#464B71]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#464B71] group-hover:text-[#118AB2]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-[#464B71]/75">{caption}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-xs font-extrabold text-[#118AB2]">
                <span>{cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Dedicated Page Directory Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DDDCD4] bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#464B71]">
            <Info className="h-4 w-4 text-[#118AB2]" />
            <span>Explore detailed clinical guides, branch locations, and patient FAQs:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/services"
              className="rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Our Services
            </Link>
            <Link
              to="/about"
              className="rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              About Victorio
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Patient FAQ</span>
            </Link>
            <Link
              to="/contact"
              className="rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              All 7 Branches &amp; Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
