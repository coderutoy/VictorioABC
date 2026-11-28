import { Link } from 'react-router-dom';
import {
  MapPin,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Syringe,
  ArrowRight,
  Building2,
  Stethoscope,
  CalendarClock,
  CheckCircle2,
  Smartphone,
  HeartHandshake,
  Clock,
  LocateFixed,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { formatPhoneDisplay } from '../config/branches';

const OVERVIEW_PREVIEW_CARDS = [
  {
    to: '/services',
    badge: 'WHO Cat I–III & PhilHealth ABTP',
    title: 'Clinical Services & Exposure Guide',
    summary:
      'Explore WHO Category I, II, and III animal bite protocols, Post-Exposure Prophylaxis (PEP), weight-based ERIG/HRIG infiltration, and Tetanus care.',
    cta: 'Explore Clinical Services',
    icon: Syringe,
    accent: 'border-[#118AB2] bg-white/95',
    iconBg: 'bg-[#118AB2] text-white',
  },
  {
    to: '/mobile-app',
    badge: '4-Step Visual Infographic',
    title: 'Patient Mobile Companion Guide',
    summary:
      'See how our mobile app provides AI preliminary wound screening, zero-paperwork QR clinic check-in, and automated Day 0–28 booster reminders.',
    cta: 'Open Mobile App Guide',
    icon: Smartphone,
    accent: 'border-[#464B71] bg-white/95',
    iconBg: 'bg-[#464B71] text-[#7CD5C7]',
  },
  {
    to: '/branches',
    badge: '7 Official Clinics',
    title: 'Our Bulacan & Caloocan Branches',
    summary:
      'View verified addresses, clinic hours, emergency hotlines, and direct Google Maps links across all 7 Victorio Animal Bite Center locations.',
    cta: 'View All 7 Branches',
    icon: Building2,
    accent: 'border-[#7CD5C7] bg-white/95',
    iconBg: 'bg-[#7CD5C7] text-[#464B71]',
  },
  {
    to: '/partners',
    badge: 'Institutional Network',
    title: 'Our Clinic & Healthcare Partners',
    summary:
      'Learn about our upcoming healthcare, HMO, LGU, and community partner showcase across Bulacan and Metro Manila.',
    cta: 'View Partners Page',
    icon: HeartHandshake,
    accent: 'border-[#DDDCD4] bg-white/95',
    iconBg: 'bg-[#118AB2]/15 text-[#118AB2]',
  },
];

export function HomePage() {
  const {
    selectedPublicBranch,
    detectNearestBranch,
    geolocationStatus,
  } = useBranch();

  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. CLEAN HERO SECTION WITH SCALED-UP DOGS & CATS ARTWORK */}
      <section className="relative overflow-hidden bg-[#464B71] py-10 text-white shadow-md sm:py-12 lg:py-14">
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
            {/* Left 7 Columns: Headline, Clinical Value Proposition & Primary Patient CTAs */}
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
                Immediate walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), weight-based Category III ERIG/HRIG wound infiltration, and cross-branch Digital QR Pass continuity across our 7 Bulacan and Caloocan clinics.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/services"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7CD5C7]"
                >
                  <Syringe className="h-4 w-4" />
                  <span>Explore Services</span>
                </Link>

                <Link
                  to="/branches"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-6 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Find Nearest Branch</span>
                </Link>
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

            {/* Right 5 Columns: Larger Hero Dogs & Cats Illustration Stage */}
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

      {/* 2. FEATURED CLINIC BRANCH CARD BELOW THE HERO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          data-testid="featured-branch-card"
          className="rounded-3xl border-2 border-[#118AB2] bg-white/95 p-6 shadow-md backdrop-blur-xs sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDDCD4] pb-5">
            <div className="flex items-center gap-3.5">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio ABC Emblem"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-[#118AB2] bg-white object-cover shadow-xs"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#118AB2]/15 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                    Featured Clinic Branch
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>Open Daily</span>
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-extrabold text-[#464B71] sm:text-2xl">
                  {selectedPublicBranch.name}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={detectNearestBranch}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#118AB2] bg-[#118AB2]/10 px-4 py-2 text-xs font-extrabold text-[#118AB2] transition hover:bg-[#118AB2] hover:text-white"
              >
                <LocateFixed className="h-4 w-4" />
                <span>
                  {geolocationStatus === 'detecting'
                    ? 'Detecting Nearest...'
                    : 'Detect Nearest Branch'}
                </span>
              </button>

              <Link
                to="/branches"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#343857]"
              >
                <span>View All 7 Branches</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-center">
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F2F2ED]/70 p-4 text-xs">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[#464B71]/70">
                    Verified Address
                  </p>
                  <p className="mt-0.5 font-bold text-[#464B71]">
                    {selectedPublicBranch.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F2F2ED]/70 p-4 text-xs">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[#464B71]/70">
                    Clinic Hours
                  </p>
                  <p className="mt-0.5 font-bold text-[#464B71]">
                    {selectedPublicBranch.hours}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-[#F2F2ED]/70 p-4 text-xs">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[#464B71]/70">
                    Available Care
                  </p>
                  <p className="mt-0.5 font-bold text-[#464B71]">
                    Walk-In PEP/PrEP, Category III ERIG/HRIG &amp; Digital QR Pass
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:col-span-4">
              <a
                href={`tel:${selectedPublicBranch.contactNumber}`}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#0D6E8E]"
              >
                <PhoneCall className="h-4 w-4 shrink-0" />
                <span>Call {formattedPhone}</span>
              </a>

              <a
                href={selectedPublicBranch.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#464B71]/25 bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] transition hover:bg-[#464B71] hover:text-white"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-[#118AB2]" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONCISE OVERVIEW PREVIEW CARDS LINKING TO DEDICATED STANDALONE PAGES */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div>
          <span className="rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
            Patient Information Hub
          </span>
          <h2 className="mt-1.5 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
            Everything You Need for Safe, Timely Bite Care
          </h2>
          <p className="mt-1 text-xs text-[#464B71]/80 sm:text-sm">
            Explore our dedicated pages for clinical services, mobile app pre-triage, clinic locations, and clinical guides.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {OVERVIEW_PREVIEW_CARDS.map(
            ({ to, badge, title, summary, cta, icon: Icon, accent, iconBg }) => (
              <Link
                key={to}
                to={to}
                className={`group flex flex-col justify-between rounded-3xl border-2 p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${accent}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs ${iconBg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#F2F2ED] px-3 py-1 text-[11px] font-extrabold text-[#464B71] ring-1 ring-[#DDDCD4]">
                      {badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold text-[#464B71] group-hover:text-[#118AB2] sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
                    {summary}
                  </p>
                </div>

                <div className="mt-5 flex min-h-[46px] items-center justify-between rounded-xl bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] transition group-hover:bg-[#118AB2] group-hover:text-white">
                  <span>{cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            )
          )}
        </div>

        {/* Quick Clinical Guides Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DDDCD4] bg-white/95 px-5 py-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#464B71]">
            <Stethoscope className="h-4 w-4 text-[#118AB2]" />
            <span>Dedicated Clinical Reference Guides:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/triage-guide"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Emergency Triage Guide</span>
            </Link>
            <Link
              to="/roadmap"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <CalendarClock className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Day 0–28 PEP Roadmap</span>
            </Link>
            <Link
              to="/protocols"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <Stethoscope className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Clinical &amp; ERIG Protocols</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export const PublicLandingPage = HomePage;
export default HomePage;
