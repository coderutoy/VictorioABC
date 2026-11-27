import { Link } from 'react-router-dom';
import {
  MapPin,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Syringe,
  QrCode,
  ArrowRight,
  Building2,
  Stethoscope,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { formatPhoneDisplay } from '../config/branches';

const DEDICATED_GUIDE_CARDS = [
  {
    to: '/triage-guide',
    badge: 'First-Aid & WHO Cat I–III',
    title: 'Emergency Bite & Triage Guide',
    summary:
      'Step-by-step 15-minute wound washing guide, WHO Category I–III visual criteria, and interactive advisory exposure check.',
    cta: 'Open Triage Guide',
    icon: ShieldCheck,
    accent: 'border-[#118AB2] bg-white/95',
    iconBg: 'bg-[#118AB2] text-white',
  },
  {
    to: '/roadmap',
    badge: 'Day 0 • 3 • 7 • 14 • 28',
    title: 'PEP Vaccination Roadmap',
    summary:
      'Interactive Day 0–28 vaccination timeline stepper, ID vs. IM vs. Booster schedule planner, and cross-branch QR dose guide.',
    cta: 'Open Vaccination Roadmap',
    icon: CalendarClock,
    accent: 'border-[#464B71] bg-white/95',
    iconBg: 'bg-[#464B71] text-[#7CD5C7]',
  },
  {
    to: '/protocols',
    badge: 'DOH / WHO Standards',
    title: 'Clinical & ERIG Protocols',
    summary:
      'Physician clinical decision matrix, weight-based ERIG (40 IU/kg) & HRIG (20 IU/kg) dosage calculator, and Tetanus protocols.',
    cta: 'Open Clinical Protocols',
    icon: Stethoscope,
    accent: 'border-[#7CD5C7] bg-white/95',
    iconBg: 'bg-[#7CD5C7] text-[#464B71]',
  },
];

const CLINIC_HIGHLIGHTS = [
  {
    title: '7 Official Branches Across Bulacan & Caloocan',
    caption: 'Baliwag • Santa Maria • Pandi • DRT • Meycauayan (Camalig & Poblacion) • Caloocan',
    icon: Building2,
    to: '/contact',
    cta: 'Branch Directory',
  },
  {
    title: 'Walk-In PEP, PrEP & ERIG Wound Care',
    caption: 'Cold-chain monitored PVRV/PCECV vaccines, Equine/Human RIG & Tetanus Toxoid',
    icon: Syringe,
    to: '/services',
    cta: 'View Services',
  },
  {
    title: 'Cross-Branch Digital QR Pass',
    caption: 'Start Day 0 at one branch and take follow-up doses at any Victorio ABC location',
    icon: QrCode,
    to: '/about',
    cta: 'About Victorio',
  },
];

export function PublicLandingPage() {
  const { isAuthenticated } = useAuth();
  const { selectedPublicBranch } = useBranch();
  const { highContrast } = useAccessibility();

  const portalPath = isAuthenticated
    ? '/dashboard'
    : `/login?branch=${encodeURIComponent(selectedPublicBranch.slug)}`;

  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  return (
    <div className="space-y-10 pb-14">
      {/* 1. Compact, Balanced Hero / Branch Spotlight Section */}
      <section className="relative overflow-hidden bg-[#464B71] py-8 text-white shadow-md sm:py-10 lg:py-12">
        {/* Soft Radial Glow / Light Organic Contrast Backdrop Directly Behind the Bottom-Right Pets */}
        {!highContrast && (
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -bottom-12 -right-12 z-0 h-[240px] w-[280px] rounded-full blur-2xl sm:h-[320px] sm:w-[380px] lg:h-[440px] lg:w-[540px]"
            style={{
              background:
                'radial-gradient(circle at 65% 65%, rgba(242, 242, 237, 0.48) 0%, rgba(124, 213, 199, 0.28) 44%, rgba(70, 75, 113, 0) 76%)',
            }}
          />
        )}

        {/* Decorative Bottom-Right Two Dogs & Two Cats Vector Cutout SVG */}
        <img
          src="/images/hero-pets.svg"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className={`pointer-events-none select-none absolute bottom-0 right-0 z-0 h-auto w-[190px] sm:w-[260px] lg:w-[400px] xl:w-[480px] max-w-[42vw] bg-transparent object-contain object-right-bottom transition-opacity duration-300 ${
            highContrast ? 'opacity-10' : 'opacity-20 sm:opacity-35 lg:opacity-95'
          }`}
        />

        {/* Foreground Content Centered & Cohesively Aligned With Branch Card and Pets */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Hero Headline & Primary CTAs */}
            <div className="space-y-4 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <ShieldCheck className="h-4 w-4" />
                <span>7 Official Branches • Bulacan &amp; Metro Manila</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[42px]">
                Compassionate, WHO-Guided{' '}
                <span className="text-[#7CD5C7]">Animal Bite &amp; Rabies Care</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                Walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), Category III ERIG/HRIG wound infiltration, and cross-branch Digital QR Pass continuity across our 7 clinics.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={portalPath}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7CD5C7]"
                >
                  <span>{isAuthenticated ? 'Open Clinical Portal' : 'Portal Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-6 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                >
                  <Syringe className="h-4 w-4" />
                  <span>View Our Services</span>
                </Link>
              </div>
            </div>

            {/* Active Nearest-Branch Spotlight Card (Cohesively Centered & Aligned With Pets) */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="rounded-2xl border-2 border-[#7CD5C7] bg-white/95 backdrop-blur-sm p-5 text-[#464B71] shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-[#F2F2ED] pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src="/victorio_logo.jpg"
                      alt="Victorio ABC Emblem"
                      className="h-11 w-11 shrink-0 rounded-full border-2 border-[#118AB2] object-cover"
                    />
                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                        Active Branch Spotlight
                      </span>
                      <h2 className="truncate text-base font-extrabold text-[#464B71]">
                        {selectedPublicBranch.shortName}
                      </h2>
                    </div>
                  </div>

                  {/* Calm, Non-Interactive "Nearest" Status Pill */}
                  <span className="pointer-events-none select-none inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#7CD5C7]/25 px-3 py-1 text-xs font-bold text-[#2E5E59]">
                    <span className="h-2 w-2 rounded-full bg-[#1E6B60]" />
                    <span>Nearest</span>
                  </span>
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
                    <span className="font-medium text-[#464B71]/85">
                      {selectedPublicBranch.hours}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedPublicBranch.contactNumber}`}
                    className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span>Call {formattedPhone}</span>
                  </a>
                  <a
                    href={selectedPublicBranch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#DDDCD4]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#118AB2]" />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact High-Contrast Navigation Cards to Dedicated Guide, Roadmap & Protocol Pages */}
      <section id="clinical-guides" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#DDDCD4] bg-white/90 backdrop-blur-[2px] p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                Dedicated Clinical Guides
              </span>
              <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
                Explore Triage Guides, Vaccination Roadmaps &amp; Protocols
              </h2>
            </div>
            <Link
              to="/contact"
              className="text-xs font-extrabold text-[#118AB2] hover:underline"
            >
              Need immediate care? View all 7 branches &rarr;
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {DEDICATED_GUIDE_CARDS.map(
              ({ to, badge, title, summary, cta, icon: Icon, accent, iconBg }) => (
                <Link
                  key={to}
                  to={to}
                  className={`group flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${accent}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${iconBg}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-[#F2F2ED] px-2.5 py-0.5 text-[11px] font-extrabold text-[#464B71] ring-1 ring-[#DDDCD4]">
                        {badge}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-extrabold text-[#464B71] group-hover:text-[#118AB2]">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
                      {summary}
                    </p>
                  </div>

                  <div className="mt-5 flex min-h-[48px] items-center justify-between rounded-xl bg-[#F2F2ED] px-4 py-2 text-xs font-extrabold text-[#464B71] group-hover:bg-[#118AB2] group-hover:text-white">
                    <span>{cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* 3. Brief Clinic Highlights & Page Directory */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {CLINIC_HIGHLIGHTS.map(({ title, caption, icon: Icon, to, cta }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-5 shadow-sm transition hover:border-[#118AB2] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7CD5C7]/35 text-[#464B71]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#464B71] group-hover:text-[#118AB2]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-[#464B71]/80">{caption}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-xs font-extrabold text-[#118AB2]">
                <span>{cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] px-5 py-4">
          <span className="text-xs font-extrabold text-[#464B71]">
            Quick Directory:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/triage-guide"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Triage Guide
            </Link>
            <Link
              to="/roadmap"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Vaccination Roadmap
            </Link>
            <Link
              to="/protocols"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Clinical Protocols
            </Link>
            <Link
              to="/faq"
              className="inline-flex min-h-[48px] items-center gap-1 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>FAQ</span>
            </Link>
            <Link
              to="/careers"
              className="inline-flex min-h-[48px] items-center gap-1 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <Briefcase className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Careers</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              All 7 Branches &amp; Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
