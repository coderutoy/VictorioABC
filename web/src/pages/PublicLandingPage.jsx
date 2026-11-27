import { useState } from 'react';
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
  Navigation,
  HelpCircle,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

const BRANCH_COORDS = {
  baliwag: { lat: 14.9547, lng: 120.8969 },
  'santa-maria': { lat: 14.8181, lng: 120.9563 },
  pandi: { lat: 14.8658, lng: 120.9571 },
  drt: { lat: 14.9964, lng: 121.0853 },
  'meycauayan-camalig': { lat: 14.7568, lng: 120.9942 },
  'meycauayan-poblacion': { lat: 14.7369, lng: 120.9606 },
  'cefels-caloocan': { lat: 14.7566, lng: 121.0445 },
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();
  const [nearestDistanceKm, setNearestDistanceKm] = useState(null);
  const [locating, setLocating] = useState(false);

  const portalPath = isAuthenticated
    ? '/dashboard'
    : `/login?branch=${encodeURIComponent(selectedPublicBranch.slug)}`;

  // Explicit user-triggered geolocation (never fires automatically on page load)
  const handleFindNearestBranch = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let bestSlug = selectedPublicBranch.slug;
        let bestDist = Infinity;

        for (const branch of publicBranches) {
          const coords = BRANCH_COORDS[branch.slug];
          if (coords) {
            const dist = haversineKm(latitude, longitude, coords.lat, coords.lng);
            if (dist < bestDist) {
              bestDist = dist;
              bestSlug = branch.slug;
            }
          }
        }

        setSelectedBranchSlug(bestSlug);
        setNearestDistanceKm(bestDist.toFixed(1));
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-10 pb-14">
      {/* 1. Dynamic Hero Banner with Active Nearest-Branch Spotlight Card */}
      <section className="bg-[#464B71]/95 py-10 text-white shadow-md sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <ShieldCheck className="h-4 w-4" />
                <span>7 Official Branches • Bulacan &amp; Metro Manila</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Compassionate, WHO-Guided{' '}
                <span className="text-[#7CD5C7]">Animal Bite &amp; Rabies Care</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                Walk-in Anti-Rabies Vaccination (PEP &amp; PrEP), Category III ERIG/HRIG wound infiltration, and cross-branch Digital QR Pass continuity across our 7 clinics.
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

            {/* Active Nearest-Branch Spotlight Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-2 border-[#7CD5C7] bg-white p-5 text-[#464B71] shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-[#F2F2ED] pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/victorio_logo.jpg"
                      alt="Victorio ABC Emblem"
                      className="h-12 w-12 rounded-full border-2 border-[#118AB2] object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                          Active Branch Spotlight
                        </span>
                        {nearestDistanceKm && (
                          <span className="rounded-full bg-[#7CD5C7]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#464B71]">
                            ~{nearestDistanceKm} km away
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-extrabold text-[#464B71]">
                        {selectedPublicBranch.shortName}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFindNearestBranch}
                    disabled={locating}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-2.5 py-1 text-[11px] font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#118AB2]" />
                    <span>{locating ? 'Locating...' : 'Nearest'}</span>
                  </button>
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
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Call {selectedPublicBranch.contactNumber}</span>
                  </a>
                  <a
                    href={selectedPublicBranch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#DDDCD4]"
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

      {/* 2. Compact High-Contrast Navigation Cards to Dedicated Guide, Roadmap & Protocol Pages */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  className={`group flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${accent}`}
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

                  <div className="mt-5 flex min-h-[44px] items-center justify-between rounded-xl bg-[#F2F2ED] px-4 py-2 text-xs font-extrabold text-[#464B71] group-hover:bg-[#118AB2] group-hover:text-white">
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
              className="group flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white/95 backdrop-blur-[2px] p-5 shadow-sm transition hover:border-[#118AB2] hover:shadow-md"
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
              className="min-h-[42px] inline-flex items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Triage Guide
            </Link>
            <Link
              to="/roadmap"
              className="min-h-[42px] inline-flex items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Vaccination Roadmap
            </Link>
            <Link
              to="/protocols"
              className="min-h-[42px] inline-flex items-center rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              Clinical Protocols
            </Link>
            <Link
              to="/faq"
              className="min-h-[42px] inline-flex items-center gap-1 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>FAQ</span>
            </Link>
            <Link
              to="/careers"
              className="min-h-[42px] inline-flex items-center gap-1 rounded-xl bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <Briefcase className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Careers</span>
            </Link>
            <Link
              to="/contact"
              className="min-h-[42px] inline-flex items-center rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              All 7 Branches &amp; Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
