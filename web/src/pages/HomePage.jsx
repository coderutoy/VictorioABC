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
  Smartphone,
  Camera,
  HeartHandshake,
  Award,
  Clock,
  LocateFixed,
  Stamp,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { OFFICIAL_BRANCHES, formatPhoneDisplay } from '../config/branches';

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

const CORE_CLINICAL_SERVICES = [
  {
    title: 'Post-Exposure Prophylaxis (PEP)',
    subtitle: 'Updated Thai Red Cross Intradermal (ID) & Intramuscular (IM) Regimens',
    detail:
      'WHO-prequalified PVRV (Verorab / Speeda) and PCECV vaccines stored under continuous 2.0°C–8.0°C digital cold-chain monitoring across all 7 clinics.',
    icon: Syringe,
  },
  {
    title: 'Category III ERIG & HRIG Infiltration',
    subtitle: 'Precision Weight-Based Immunoglobulin (40 IU/kg ERIG • 20 IU/kg HRIG)',
    detail:
      'Immediate passive immunity infiltrated directly around deep or cranial/hand wounds to neutralize rabies virus at the site of entry.',
    icon: Stethoscope,
  },
  {
    title: 'Tetanus Toxoid & ATS Prophylaxis',
    subtitle: 'Comprehensive Wound Cleaning & Secondary Infection Prevention',
    detail:
      'Antiseptic povidone-iodine irrigation, Tetanus Toxoid (TT) / Anti-Tetanus Serum (ATS) administration, and physician antibiotic orders.',
    icon: ShieldCheck,
  },
  {
    title: 'PhilHealth Animal Bite Treatment Package (ABTP)',
    subtitle: 'DOH-Certified Animal Bite Treatment Center Coverage',
    detail:
      'Electronic PRC physician sign-off and official Animal Bite Registry documentation supporting eligible PhilHealth ABTP benefit claims.',
    icon: Award,
  },
];

const PEP_TIMELINE_DAYS = [
  { day: 'D0', done: true },
  { day: 'D3', done: true },
  { day: 'D7', active: true },
  { day: 'D14', done: false },
  { day: 'D28', done: false },
];

// 6 intentionally blank placeholder partner slots (zero fake company names or fake logos)
const BLANK_PARTNER_SLOTS = [1, 2, 3, 4, 5, 6];

export function HomePage() {
  const {
    selectedPublicBranch,
    setSelectedBranchSlug,
    detectNearestBranch,
    geolocationStatus,
  } = useBranch();

  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  return (
    <div className="space-y-14 pb-16">
      {/* 1. CLEAN, FOCUSED HERO SECTION WITH SCALED-UP DOGS & CATS ARTWORK */}
      <section className="relative overflow-hidden bg-[#464B71] py-10 text-white shadow-md sm:py-12 lg:py-14">
        {/* Warm Radial Contrast Glow Directly Behind the Hero Pets */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-16 -right-12 z-0 h-[320px] w-[360px] rounded-full blur-2xl sm:h-[440px] sm:w-[520px] lg:h-[580px] lg:w-[700px]"
          style={{
            background:
              'radial-gradient(circle at 60% 60%, rgba(242, 242, 237, 0.58) 0%, rgba(124, 213, 199, 0.34) 46%, rgba(70, 75, 113, 0) 76%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left 7 Columns: Compelling Headline & Primary CTAs */}
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  DOH &amp; WHO-Compliant Animal Bite Treatment Network • 7 Official Branches
                </span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Compassionate, Intelligent{' '}
                <span className="text-[#7CD5C7]">
                  Animal Bite &amp; Rabies Protection
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
                Immediate walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), weight-based Category III ERIG/HRIG wound infiltration, and AI-assisted mobile pre-triage across our 7 Bulacan and Caloocan clinics.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#our-branches"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7CD5C7]"
                >
                  <MapPin className="h-4 w-4" />
                  <span>View Featured Branch &amp; 7 Clinics</span>
                </a>

                <a
                  href="#mobile-app-guide"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-6 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Patient Mobile Companion Guide</span>
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                  <p className="font-extrabold text-[#7CD5C7]">7 Official Clinics</p>
                  <p className="mt-0.5 text-[11px] text-white/80">
                    Bulacan &amp; Caloocan
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                  <p className="font-extrabold text-[#7CD5C7]">2.0°C – 8.0°C</p>
                  <p className="mt-0.5 text-[11px] text-white/80">
                    Monitored Cold-Chain
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                  <p className="font-extrabold text-[#7CD5C7]">PhilHealth ABTP</p>
                  <p className="mt-0.5 text-[11px] text-white/80">
                    PRC-Signed Registry
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Bold, Scaled-Up Hero Dogs & Cats Illustration Stage */}
            <div className="relative flex items-end justify-center lg:col-span-5 lg:justify-end">
              <img
                src="/images/hero-pets.svg"
                alt="Victorio ABC Companion Dogs and Cats Illustration"
                loading="eager"
                decoding="async"
                data-testid="hero-pets-illustration"
                className="pointer-events-none select-none relative z-10 h-auto w-[320px] max-w-full object-contain drop-shadow-2xl sm:w-[430px] lg:w-[540px] xl:w-[600px] lg:scale-110 lg:origin-bottom-right"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CLINIC BRANCH SHOWCASE (MOVED BELOW HERO) + 7-BRANCH DIRECTORY */}
      <section
        id="our-branches"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 p-6 shadow-md backdrop-blur-xs sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DDDCD4] pb-5">
            <div>
              <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
                Featured Clinic Spotlight &amp; 7-Branch Directory
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                Find Your Nearest Victorio Animal Bite Center
              </h2>
              <p className="mt-1 text-xs text-[#464B71]/80 sm:text-sm">
                Select any of our 7 official clinics below to inspect its verified address, hotline, and direct Google Maps directions.
              </p>
            </div>

            <button
              type="button"
              onClick={detectNearestBranch}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#118AB2] bg-[#118AB2]/10 px-4 py-2 text-xs font-extrabold text-[#118AB2] transition hover:bg-[#118AB2] hover:text-white"
            >
              <LocateFixed className="h-4 w-4" />
              <span>
                {geolocationStatus === 'detecting'
                  ? 'Detecting Nearest Clinic...'
                  : 'Auto-Detect Nearest Branch'}
              </span>
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left 5 Cols: Currently Selected Featured Clinic Branch Card */}
            <div className="lg:col-span-5">
              <div
                data-testid="featured-branch-card"
                className="flex h-full flex-col justify-between rounded-2xl border-2 border-[#118AB2] bg-[#F2F2ED]/70 p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[#DDDCD4] pb-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src="/victorio_logo.jpg"
                        alt="Victorio ABC Emblem"
                        className="h-12 w-12 shrink-0 rounded-full border-2 border-[#118AB2] bg-white object-cover"
                      />
                      <div className="min-w-0">
                        <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                          Featured Clinic Branch
                        </span>
                        <h3 className="truncate text-lg font-extrabold text-[#464B71]">
                          {selectedPublicBranch.shortName}
                        </h3>
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      <span>Active</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-[#464B71]/70">
                          Verified Clinic Address
                        </p>
                        <p className="font-bold text-[#464B71]">
                          {selectedPublicBranch.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-[#464B71]/70">
                          Clinic Hours &amp; Walk-In Availability
                        </p>
                        <p className="font-bold text-[#464B71]">
                          {selectedPublicBranch.hours}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-[#464B71]/70">
                          Available Biologics &amp; Services
                        </p>
                        <p className="font-semibold text-[#464B71]/90">
                          Walk-In PEP/PrEP (Verorab &amp; Speeda PVRV), Category III ERIG/HRIG Infiltration, Tetanus Toxoid &amp; Cross-Branch Digital QR Pass.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-[#DDDCD4] pt-4">
                  <a
                    href={`tel:${selectedPublicBranch.contactNumber}`}
                    className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-3 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#0D6E8E]"
                  >
                    <PhoneCall className="h-4 w-4 shrink-0" />
                    <span>Call {formattedPhone}</span>
                  </a>

                  <a
                    href={selectedPublicBranch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#464B71]/25 bg-white px-3 py-2.5 text-xs font-extrabold text-[#464B71] transition hover:bg-[#464B71] hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>Open Google Maps</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Interactive 7-Branch Directory Grid */}
            <div className="lg:col-span-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {OFFICIAL_BRANCHES.map((branch) => {
                  const isSelected = branch.slug === selectedPublicBranch.slug;
                  return (
                    <div
                      key={branch.slug}
                      onClick={() => setSelectedBranchSlug(branch.slug)}
                      className={`group cursor-pointer rounded-2xl border-2 p-4 transition ${
                        isSelected
                          ? 'border-[#118AB2] bg-[#7CD5C7]/20 shadow-xs'
                          : 'border-[#DDDCD4] bg-white hover:border-[#118AB2]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-[#118AB2]" />
                          <h4 className="text-xs font-extrabold text-[#464B71] sm:text-sm">
                            {branch.shortName}
                          </h4>
                        </div>
                        {isSelected && (
                          <span className="rounded-full bg-[#118AB2] px-2 py-0.5 text-[10px] font-extrabold text-white">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[#464B71]/80">
                        {branch.address}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-[#DDDCD4]/70 pt-2 text-[11px] font-extrabold">
                        <a
                          href={`tel:${branch.contactNumber}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#118AB2] hover:underline"
                        >
                          {branch.displayPhone}
                        </a>
                        <a
                          href={branch.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[#464B71] hover:text-[#118AB2]"
                        >
                          <span>Directions</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE SERVICES & WHO/DOH BITE CATEGORY GUIDE */}
      <section
        id="services"
        className="mx-auto max-w-7xl scroll-mt-24 space-y-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 p-6 shadow-md backdrop-blur-xs sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                WHO / DOH Clinical Standards
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                Core Clinical Services &amp; Bite Exposure Category Guide
              </h2>
              <p className="mt-1 text-xs text-[#464B71]/80 sm:text-sm">
                Understanding WHO Category I, II, and III animal bite exposures and our standardized DOH prophylaxis protocols.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/triage-guide"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <span>Full Triage Guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/roadmap"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <span>Day 0–28 PEP Roadmap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/protocols"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <span>Clinical Protocols</span>
                <ArrowRight className="h-3.5 w-3.5" />
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_CLINICAL_SERVICES.map(({ title, subtitle, detail, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#DDDCD4] bg-white p-5 shadow-2xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-[#464B71]">{title}</h3>
                <p className="mt-0.5 text-[11px] font-bold text-[#118AB2]">{subtitle}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#464B71]/80">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TRUE VISUAL CLINICAL INFOGRAPHIC: "PATIENT MOBILE COMPANION GUIDE" */}
      <section
        id="mobile-app-guide"
        data-testid="mobile-companion-infographic"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="overflow-hidden rounded-3xl border-2 border-[#464B71] bg-[#464B71] p-6 text-white shadow-xl sm:p-8 lg:p-10">
          {/* Infographic Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile-Exclusive Clinical Companion</span>
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Patient Mobile Companion Guide
              </h2>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">
                From AI wound screening to cross-branch Day 0–28 PEP tracking in 4 connected steps.
              </p>
            </div>

            <Link
              to="/mobile-app-only"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-xs font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Mobile App QR</span>
            </Link>
          </div>

          {/* Main Infographic Grid: 4 Connected Visual Nodes (Left 8 Cols) + Stylized Phone Screen Preview (Right 4 Cols) */}
          <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
            {/* Left 8 Columns: Visual Connected Step Flow (Steps 1 -> 4) */}
            <div className="relative lg:col-span-8">
              {/* Desktop Horizontal Dashed Connector SVG Line */}
              <svg
                aria-hidden="true"
                viewBox="0 0 800 24"
                className="pointer-events-none hidden w-full text-[#7CD5C7]/50 md:block"
              >
                <line
                  x1="60"
                  y1="12"
                  x2="740"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                />
                <circle cx="100" cy="12" r="7" fill="#7CD5C7" />
                <circle cx="300" cy="12" r="7" fill="#7CD5C7" />
                <circle cx="500" cy="12" r="7" fill="#7CD5C7" />
                <circle cx="700" cy="12" r="7" fill="#7CD5C7" />
              </svg>

              <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* STEP 1: SNAP & SCREEN */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                        01
                      </span>
                      <span className="rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-extrabold text-red-200 ring-1 ring-red-400/40">
                        AI CAT I–III
                      </span>
                    </div>

                    {/* Visual Camera + AI Badge Graphic */}
                    <div className="mt-3 flex h-20 flex-col items-center justify-center rounded-xl border border-dashed border-[#7CD5C7]/40 bg-[#1E2238] p-2">
                      <Camera className="h-6 w-6 text-[#7CD5C7]" />
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-extrabold">
                          CAT I
                        </span>
                        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold">
                          CAT II
                        </span>
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold">
                          CAT III
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-white">
                      1. Snap &amp; Screen
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-white/80">
                      Capture wound photo for instant AI Category I–III screening.
                    </p>
                  </div>
                </div>

                {/* STEP 2: SCAN AT CLINIC */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                        02
                      </span>
                      <span className="rounded-full bg-[#118AB2]/35 px-2 py-0.5 text-[10px] font-extrabold text-[#7CD5C7]">
                        7 CLINICS
                      </span>
                    </div>

                    {/* Visual QR Pass + 7-Branch Pin Graphic */}
                    <div className="mt-3 flex h-20 items-center justify-center gap-3 rounded-xl border border-[#7CD5C7]/30 bg-[#1E2238] p-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 text-[#464B71]">
                        <QrCode className="h-9 w-9" />
                      </div>
                      <div className="text-left">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#7CD5C7]">
                          <MapPin className="h-3 w-3" />
                          <span>Nearest ABC</span>
                        </span>
                        <p className="text-[10px] font-bold text-white">
                          Zero-Paperwork Triage
                        </p>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-white">
                      2. Scan at Clinic
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-white/80">
                      Present your intake QR pass at any of our 7 official branches.
                    </p>
                  </div>
                </div>

                {/* STEP 3: DOCTOR-VERIFIED CARD */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                        03
                      </span>
                      <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                        PRC STAMPED
                      </span>
                    </div>

                    {/* Visual PRC-Verified Digital Bite Card Graphic */}
                    <div className="mt-3 flex h-20 flex-col justify-center rounded-xl border border-emerald-400/40 bg-[#1E2238] px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#7CD5C7]">
                          DIGITAL PEP CARD
                        </span>
                        <Stamp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="mt-1 font-mono text-[10px] font-bold text-white">
                        MD PRC-0148291
                      </p>
                      <p className="text-[9px] text-emerald-300">
                        PhilHealth ABTP Validated
                      </p>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-white">
                      3. Doctor-Verified Card
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-white/80">
                      Physician confirms category &amp; stamps your digital bite card.
                    </p>
                  </div>
                </div>

                {/* STEP 4: DAY 0-28 PEP TRACKER */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                        04
                      </span>
                      <span className="rounded-full bg-[#7CD5C7]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#7CD5C7]">
                        AUTO ALERTS
                      </span>
                    </div>

                    {/* Visual Mini Timeline Strip D0 -> D3 -> D7 -> D14 -> D28 */}
                    <div className="mt-3 flex h-20 flex-col justify-center rounded-xl border border-[#7CD5C7]/30 bg-[#1E2238] px-2.5 py-2">
                      <div className="flex items-center justify-between">
                        {PEP_TIMELINE_DAYS.map((item) => (
                          <div key={item.day} className="flex flex-col items-center">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold ${
                                item.done
                                  ? 'bg-emerald-500 text-white'
                                  : item.active
                                    ? 'bg-[#7CD5C7] text-[#464B71] ring-2 ring-white'
                                    : 'bg-white/15 text-white/70'
                              }`}
                            >
                              {item.done ? '✓' : '•'}
                            </span>
                            <span className="mt-1 font-mono text-[9px] font-extrabold text-[#7CD5C7]">
                              {item.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-white">
                      4. Day 0–28 PEP Tracker
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-white/80">
                      Automated booster alerts &amp; cross-branch dose continuity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Compact Stylized Phone Screen Mockup Visual Callout */}
            <div className="flex justify-center lg:col-span-4">
              <div className="w-full max-w-[300px] rounded-[32px] border-4 border-[#7CD5C7] bg-[#1E2238] p-4 shadow-2xl">
                {/* Phone Top Speaker Notch */}
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />

                <div className="rounded-2xl bg-[#F2F2ED] p-3.5 text-[#464B71]">
                  <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src="/victorio_logo.jpg"
                        alt="Victorio App Icon"
                        className="h-7 w-7 rounded-full border border-[#118AB2] object-cover"
                      />
                      <div>
                        <p className="text-[11px] font-extrabold leading-tight">
                          Victorio ABC Pass
                        </p>
                        <p className="text-[9px] font-bold text-[#118AB2]">
                          PRC-Verified Digital Card
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                      CAT III
                    </span>
                  </div>

                  {/* Mini QR + Case Summary */}
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-2xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#464B71] text-white">
                      <QrCode className="h-8 w-8" />
                    </div>
                    <div className="min-w-0 text-[10px]">
                      <p className="truncate font-mono font-extrabold text-[#118AB2]">
                        ABC-STM-2026-103
                      </p>
                      <p className="font-bold">Verorab PVRV (ID)</p>
                      <p className="text-[9px] opacity-75">Santa Maria Branch</p>
                    </div>
                  </div>

                  {/* Mini Day 0-28 Progress Strip */}
                  <div className="mt-2.5 rounded-xl bg-white p-2.5">
                    <div className="flex items-center justify-between text-[9px] font-extrabold uppercase">
                      <span>PEP Schedule</span>
                      <span className="text-emerald-600">Next: Day 7</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      {PEP_TIMELINE_DAYS.map((d) => (
                        <span
                          key={d.day}
                          className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-extrabold ${
                            d.done
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.active
                                ? 'bg-[#118AB2] text-white'
                                : 'bg-[#F2F2ED] text-[#464B71]/60'
                          }`}
                        >
                          {d.day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BLANK "OUR PARTNERS" SHOWCASE SECTION (6 Intentionally Blank Placeholder Cards) */}
      <section
        id="partners"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 p-6 shadow-sm backdrop-blur-xs sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F2ED] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                <HeartHandshake className="h-3.5 w-3.5 text-[#118AB2]" />
                <span>Healthcare &amp; Institutional Network</span>
              </span>
              <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
                Our Clinic &amp; Healthcare Partners
              </h2>
            </div>

            <p className="text-xs font-bold italic text-[#464B71]/70">
              Official partner showcase coming soon
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
                className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-[#DDDCD4] bg-[#F2F2ED]/45 p-4 transition hover:border-[#118AB2]/40"
              >
                <div className="h-6 w-20 rounded-md border border-dashed border-[#464B71]/20 bg-white/60" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export const PublicLandingPage = HomePage;
export default HomePage;
