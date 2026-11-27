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
  Bell,
  HeartHandshake,
  Award,
  Clock,
  LocateFixed,
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

const MOBILE_APP_STEPS = [
  {
    step: 'Step 01',
    title: 'Snap a Wound Photo for Instant AI Preliminary Screening',
    description:
      'Use the Victorio ABC Mobile App to capture a clear photo of the bite or scratch. Our Computer Vision pre-triage assistant provides an instant preliminary Category I, II, or III risk indication and first-aid timer.',
    icon: Camera,
    mockupBadge: 'AI Pre-Triage: Category III (96.4%)',
    mockupTitle: 'Wound ROI Captured',
    mockupLine1: 'Site: Right Hand & Thenar Web',
    mockupLine2: '15-Min Soap & Water Timer Active',
  },
  {
    step: 'Step 02',
    title: 'Locate Your Nearest Branch & Present Your Intake QR Code',
    description:
      'Auto-detect the closest Victorio ABC clinic across Bulacan and Caloocan. Present your encrypted digital intake QR pass at the nurse triage desk for zero-paperwork admission.',
    icon: QrCode,
    mockupBadge: 'Santa Maria Branch • Open Now',
    mockupTitle: 'Digital Triage QR Pass',
    mockupLine1: 'Synced directly to Nurse & Doctor Queue',
    mockupLine2: 'AES-256-GCM RA 10173 Protected',
  },
  {
    step: 'Step 03',
    title: 'Doctor-Verified Digital Vaccination Card & Day 0–28 Reminders',
    description:
      'Once our physician verifies your wound and stamps their PRC License sign-off, your Day 0, 3, 7, 14, and 28 booster schedule and vaccine lot numbers sync automatically to your phone.',
    icon: Bell,
    mockupBadge: 'PRC-Verified PEP Schedule',
    mockupTitle: 'Day 3 Booster Reminder',
    mockupLine1: 'Verorab PVRV • Lot VRB-FEFO-STM',
    mockupLine2: 'Signed: Dr. Maria Santos (PRC-0148291)',
  },
  {
    step: 'Step 04',
    title: 'Cross-Branch Booster Continuity Across All 7 Clinics',
    description:
      'Started Day 0 in Santa Maria or Baliwag? Present your mobile app QR pass at any of our 7 official Victorio ABC branches to complete your Day 3, 7, 14, or 28 booster seamlessly.',
    icon: Smartphone,
    mockupBadge: '7 Connected Clinics',
    mockupTitle: 'Cross-Branch Continuity',
    mockupLine1: 'Baliwag • Santa Maria • Pandi • DRT',
    mockupLine2: 'Meycauayan (Camalig & Poblacion) • Caloocan',
  },
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
      {/* 1. CLEAN, FOCUSED HERO SECTION (No Featured Branch Card Beside Hero Pets) */}
      <section className="relative overflow-hidden bg-[#464B71] py-10 text-white shadow-md sm:py-14 lg:py-16">
        {/* Soft Radial Glow Directly Behind the Bottom-Right Companion Pets */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-12 -right-12 z-0 h-[260px] w-[300px] rounded-full blur-2xl sm:h-[340px] sm:w-[420px] lg:h-[460px] lg:w-[560px]"
          style={{
            background:
              'radial-gradient(circle at 65% 65%, rgba(242, 242, 237, 0.5) 0%, rgba(124, 213, 199, 0.3) 44%, rgba(70, 75, 113, 0) 76%)',
          }}
        />

        {/* Companion Pets (Dogs & Cats) Hero Artwork on Bottom-Right */}
        <img
          src="/images/hero-pets.svg"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="pointer-events-none select-none absolute bottom-0 right-0 z-0 h-auto w-[210px] max-w-[45vw] bg-transparent object-contain object-right-bottom opacity-25 transition-opacity duration-300 sm:w-[290px] sm:opacity-45 lg:w-[440px] lg:opacity-95 xl:w-[520px]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-5">
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

            <p className="text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
              Immediate walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), weight-based Category III ERIG/HRIG wound infiltration, and AI-assisted mobile pre-triage across our 7 Bulacan and Caloocan clinics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
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
                <span>How Our AI Mobile App Works</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                <p className="font-extrabold text-[#7CD5C7]">7 Official Clinics</p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  Bulacan &amp; Caloocan Network
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                <p className="font-extrabold text-[#7CD5C7]">2.0°C – 8.0°C</p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  Monitored Vaccine Cold-Chain
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
                <p className="font-extrabold text-[#7CD5C7]">PhilHealth ABTP</p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  PRC-Signed Registry Support
                </p>
              </div>
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

                <div className="mt-6 grid grid-cols-2 gap-2.5 pt-4 border-t border-[#DDDCD4]">
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

          {/* WHO Category I, II, III Breakdown Cards */}
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

          {/* 4 Core Clinical Service Cards */}
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

      {/* 4. VISUAL MOBILE APP GUIDE ("HOW OUR AI-ASSISTED MOBILE APP WORKS") */}
      <section
        id="mobile-app-guide"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border-2 border-[#464B71] bg-[#464B71] p-6 text-white shadow-lg sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Patient Mobile Companion Guide</span>
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                How Our AI-Assisted Mobile App Works
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
                Patient registration, AI wound pre-triage, and digital QR vaccination cards run exclusively inside the Victorio ABC Mobile App—connecting directly to our clinic doctors and nurses upon your arrival.
              </p>
            </div>

            <Link
              to="/mobile-app-only"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-xs font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
            >
              <QrCode className="h-4 w-4" />
              <span>Get Mobile App QR Code</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {MOBILE_APP_STEPS.map(
              ({
                step,
                title,
                description,
                icon: Icon,
                mockupBadge,
                mockupTitle,
                mockupLine1,
                mockupLine2,
              }) => (
                <div
                  key={step}
                  className="flex flex-col justify-between rounded-2xl border border-white/15 bg-[#343857] p-5 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#7CD5C7]/20 px-3 py-1 font-mono text-xs font-extrabold text-[#7CD5C7]">
                        {step}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#7CD5C7]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="mt-4 text-base font-extrabold leading-snug text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/80">
                      {description}
                    </p>
                  </div>

                  {/* Styled Mobile UI Mockup Preview Card */}
                  <div className="mt-5 rounded-2xl border border-[#7CD5C7]/40 bg-[#1E2238] p-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] font-extrabold text-[#7CD5C7]">
                        {mockupBadge}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="mt-2 font-extrabold text-white">{mockupTitle}</p>
                    <p className="mt-0.5 text-[11px] text-white/80">{mockupLine1}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#7CD5C7]">
                      {mockupLine2}
                    </p>
                  </div>
                </div>
              )
            )}
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

          {/* 6 Intentionally Blank, Minimalist Placeholder Logo Cards (Zero Fake Company Names or Fake Logos) */}
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
