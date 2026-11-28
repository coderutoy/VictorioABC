import {
  MapPin,
  PhoneCall,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  LocateFixed,
  ShieldCheck,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { OFFICIAL_BRANCHES, formatPhoneDisplay } from '../config/branches';

export function BranchesPage() {
  const {
    selectedPublicBranch,
    setSelectedBranchSlug,
    detectNearestBranch,
    geolocationStatus,
  } = useBranch();

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <Building2 className="h-3.5 w-3.5" />
              <span>7 Official Bulacan &amp; Caloocan Locations</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Our Official Clinic Branches
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Every Victorio Animal Bite Center branch offers walk-in PEP/PrEP vaccination, Category III ERIG/HRIG infiltration, and cross-branch Digital QR Pass continuity.
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

      {/* Currently Active Branch Spotlight */}
      <div className="rounded-3xl border-2 border-[#118AB2] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-extrabold uppercase text-[#118AB2]">
              Currently Selected Active Branch
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              {selectedPublicBranch.name}
            </h2>
            <p className="mt-1 text-xs text-[#464B71]/80 sm:text-sm">
              {selectedPublicBranch.address}
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
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-5 py-2.5 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <ExternalLink className="h-4 w-4 text-[#118AB2]" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* 7-Branch Directory Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {OFFICIAL_BRANCHES.map((branch) => {
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
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${branch.contactNumber}`}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span>{displayPhone}</span>
                  </a>
                  <a
                    href={branch.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#118AB2]" />
                    <span>Google Maps</span>
                  </a>
                </div>

                <button
                  type="button"
                  disabled={isSelected}
                  onClick={() => setSelectedBranchSlug(branch.slug)}
                  className={`flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                    isSelected
                      ? 'bg-[#7CD5C7]/30 text-[#464B71] cursor-default'
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
