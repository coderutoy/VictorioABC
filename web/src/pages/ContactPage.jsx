import { useMemo, useState } from 'react';
import {
  MapPin,
  PhoneCall,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

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

export function ContactPage() {
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();
  const [areaFilter, setAreaFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAndFilteredBranches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = publicBranches.filter((b) => {
      const matchesArea = areaFilter === 'All' || b.area === areaFilter;
      const matchesQuery =
        !q ||
        [b.name, b.shortName, b.address, b.contactNumber, b.area].some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(q)
        );
      return matchesArea && matchesQuery;
    });

    // Pin the currently selected branch from the header dropdown at the top
    return [...filtered].sort((a, b) => {
      if (a.slug === selectedPublicBranch.slug) return -1;
      if (b.slug === selectedPublicBranch.slug) return 1;
      return 0;
    });
  }, [publicBranches, selectedPublicBranch.slug, areaFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-9">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
          7 Official Victorio ABC Locations
        </span>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">
          Contact Us &amp; Clinic Branch Directory
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Select your preferred branch below or use the header branch switcher. All 7 branches support walk-in Day 0 PEP/ERIG intake and cross-branch QR Pass follow-up doses.
        </p>
      </div>

      {/* Pinned Active Branch Banner */}
      <div className="rounded-2xl border-2 border-[#118AB2] bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#118AB2] px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-white">
                Pinned Active Branch
              </span>
              <span className="text-xs font-bold text-[#464B71]/70">
                Tenant ID: {selectedPublicBranch.serverTenantId}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#464B71]">
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {selectedPublicBranch.contactNumber}</span>
            </a>
            <a
              href={selectedPublicBranch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <span>Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#118AB2]" />
            </a>
            <a
              href={selectedPublicBranch.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2.5 text-xs font-extrabold text-[#7CD5C7] hover:bg-[#343857]"
            >
              <FacebookIcon className="h-4 w-4" />
              <span>Official Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Search & Area Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DDDCD4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#464B71]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branch by municipality, street address, or contact number..."
            className="w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 py-2.5 pl-9 pr-3 text-xs font-semibold text-[#464B71] placeholder-[#464B71]/50 focus:border-[#118AB2] focus:bg-white focus:outline-none"
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

      {/* 7 Official Branch Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sortedAndFilteredBranches.map((branch) => {
          const isSelected = branch.slug === selectedPublicBranch.slug;
          return (
            <div
              key={branch.slug}
              className={`flex flex-col justify-between rounded-2xl border-2 bg-white p-5 shadow-sm transition ${
                isSelected
                  ? 'border-[#118AB2] ring-2 ring-[#7CD5C7]'
                  : 'border-[#DDDCD4] hover:border-[#464B71]/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                    {branch.area}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#118AB2] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Branch
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedBranchSlug(branch.slug)}
                      className="rounded-full border border-[#DDDCD4] bg-[#F2F2ED] px-2.5 py-0.5 text-[11px] font-bold text-[#464B71] hover:bg-[#DDDCD4]"
                    >
                      Set as Active
                    </button>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-[#464B71]">
                  {branch.shortName}
                </h3>

                <div className="space-y-2 text-xs text-[#464B71]/85">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <a
                      href={`tel:${branch.contactNumber}`}
                      className="font-extrabold text-[#118AB2] hover:underline"
                    >
                      {branch.contactNumber}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#F2F2ED] pt-4">
                <a
                  href={`tel:${branch.contactNumber}`}
                  className="flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-[#118AB2] px-2.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Call</span>
                </a>
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-[#F2F2ED] px-2.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                >
                  <span>Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={branch.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-[#464B71] px-2.5 py-2 text-xs font-extrabold text-[#7CD5C7] hover:bg-[#343857]"
                >
                  <FacebookIcon className="h-3.5 w-3.5" />
                  <span>FB Page</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
