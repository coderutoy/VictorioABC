import { useMemo, useState } from 'react';
import {
  MapPin,
  PhoneCall,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  LocateFixed,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { OFFICIAL_BRANCHES, formatPhoneDisplay } from '../config/branches';

const AREA_FILTERS = [
  'All',
  'Baliwag',
  'Santa Maria',
  'Pandi',
  'DRT',
  'Meycauayan',
  'Caloocan',
];

function FacebookIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.504 17.523 2 12 2S2 6.504 2 12.06c0 5.022 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.887h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.918 8.437-9.94Z" />
    </svg>
  );
}

export function BranchesPage() {
  const {
    selectedPublicBranch,
    setSelectedBranchSlug,
    detectNearestBranch,
    geolocationStatus,
  } = useBranch();

  const [areaFilter, setAreaFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBranches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = OFFICIAL_BRANCHES.filter((b) => {
      const matchesArea = areaFilter === 'All' || b.area === areaFilter;
      const matchesQuery =
        !q ||
        [b.name, b.shortName, b.address, b.contactNumber, b.area].some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(q)
        );
      return matchesArea && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (a.slug === selectedPublicBranch.slug) return -1;
      if (b.slug === selectedPublicBranch.slug) return 1;
      return 0;
    });
  }, [selectedPublicBranch.slug, areaFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <Building2 className="h-3.5 w-3.5" />
              <span>7 Official Bulacan &amp; Caloocan Locations</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Our Clinic Branches &amp; Direct Contacts
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Verified clinic addresses, emergency hotlines, official Facebook pages, and Google Maps directions across all 7 Victorio Animal Bite Center locations.
            </p>
          </div>

          <button
            type="button"
            onClick={detectNearestBranch}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-3 text-xs font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
          >
            <LocateFixed className="h-4 w-4 text-[#118AB2]" />
            <span>
              {geolocationStatus === 'detecting'
                ? 'Detecting Nearest Clinic...'
                : 'Auto-Detect Nearest Branch'}
            </span>
          </button>
        </div>
      </div>

      {/* Currently Selected Active Branch Contact Spotlight */}
      <div className="rounded-3xl border-2 border-[#118AB2] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#118AB2] px-3 py-0.5 text-[11px] font-extrabold uppercase text-white">
                Active Branch Contact
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900">
                {selectedPublicBranch.hours}
              </span>
            </div>
            <h2 className="pt-1 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              {selectedPublicBranch.name}
            </h2>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#464B71]/85 sm:text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-[#118AB2]" />
              <span>{selectedPublicBranch.address}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>
                Call{' '}
                {selectedPublicBranch.displayPhone ||
                  formatPhoneDisplay(selectedPublicBranch.contactNumber)}
              </span>
            </a>
            <a
              href={selectedPublicBranch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <ExternalLink className="h-4 w-4 text-[#118AB2]" />
              <span>Google Maps</span>
            </a>
            <a
              href={selectedPublicBranch.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#464B71] px-4 py-2.5 text-xs font-extrabold text-[#7CD5C7] hover:bg-[#343857]"
            >
              <FacebookIcon className="h-4 w-4" />
              <span>Official Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Search & Municipality Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#464B71]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branch by municipality, street address, or hotline number..."
            className="min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 py-2 pl-10 pr-3 text-xs font-semibold text-[#464B71] placeholder-[#464B71]/50 focus:border-[#118AB2] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AREA_FILTERS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setAreaFilter(area)}
              className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                areaFilter === area
                  ? 'bg-[#464B71] text-[#7CD5C7]'
                  : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* 7-Branch Directory & Contact Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBranches.map((branch) => {
          const isSelected = branch.slug === selectedPublicBranch.slug;
          const displayPhone =
            branch.displayPhone || formatPhoneDisplay(branch.contactNumber);

          return (
            <div
              key={branch.slug}
              className={`flex flex-col justify-between rounded-3xl border-2 bg-white p-6 shadow-xs transition ${
                isSelected
                  ? 'border-[#118AB2] ring-2 ring-[#7CD5C7]/40'
                  : 'border-[#DDDCD4] hover:border-[#118AB2]/60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-[#F2F2ED] pb-3.5">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                      {branch.area}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#464B71]">
                      {branch.shortName}
                    </h3>
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#118AB2] px-3 py-1 text-[11px] font-extrabold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900">
                      Open Daily
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span className="font-semibold text-[#464B71]">
                      {branch.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <a
                      href={`tel:${branch.contactNumber}`}
                      className="font-extrabold text-[#118AB2] hover:underline"
                    >
                      {displayPhone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-medium text-[#464B71]/85">
                      {branch.hours}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span className="font-medium text-[#464B71]/85">
                      PEP • PrEP • Cat III ERIG/HRIG • Tetanus
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-[#F2F2ED] pt-4">
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`tel:${branch.contactNumber}`}
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl bg-[#118AB2] px-2.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span>Call</span>
                  </a>
                  <a
                    href={branch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-2.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                  >
                    <span>Maps</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-[#118AB2]" />
                  </a>
                  <a
                    href={branch.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[42px] items-center justify-center gap-1 rounded-xl bg-[#464B71] px-2.5 py-2 text-xs font-extrabold text-[#7CD5C7] hover:bg-[#343857]"
                  >
                    <FacebookIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>FB Page</span>
                  </a>
                </div>

                <button
                  type="button"
                  disabled={isSelected}
                  onClick={() => setSelectedBranchSlug(branch.slug)}
                  className={`flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                    isSelected
                      ? 'cursor-default bg-[#7CD5C7]/30 text-[#464B71]'
                      : 'border border-[#118AB2] text-[#118AB2] hover:bg-[#118AB2] hover:text-white'
                  }`}
                >
                  {isSelected ? 'Currently Active Branch' : 'Set as Active Branch'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BranchesPage;
