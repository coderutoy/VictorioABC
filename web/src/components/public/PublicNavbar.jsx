import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  PhoneCall,
  Check,
  Menu,
  X,
  ArrowRight,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const portalPath = isAuthenticated
    ? '/dashboard'
    : `/login?branch=${encodeURIComponent(selectedPublicBranch.slug)}`;
  const portalLabel = isAuthenticated ? 'Clinical Dashboard' : 'Portal Sign In';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBranch = (slug) => {
    setSelectedBranchSlug(slug);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[#464B71] text-white shadow-md">
      {/* Top Active Branch Strip */}
      <div className="border-b border-white/10 bg-[#343857] px-4 py-1.5 text-xs text-white/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#7CD5C7]" />
            <span className="font-semibold text-[#7CD5C7]">
              Active Branch ({selectedPublicBranch.shortName}):
            </span>
            <span className="truncate text-white/85">{selectedPublicBranch.address}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex items-center gap-1 font-bold text-[#7CD5C7] hover:underline"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>{selectedPublicBranch.contactNumber}</span>
            </a>
            <a
              href={selectedPublicBranch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-white/80 hover:text-[#7CD5C7] hover:underline"
            >
              Directions &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Row (h-20 on mobile, h-24 on desktop) */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-24 lg:px-8">
        {/* Left Block: Circular Logo + Brand Title + Multi-Tenant Branch Dropdown */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#7CD5C7] bg-white p-0.5 shadow-md transition group-hover:scale-105">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio Animal Bite Center Logo"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-white sm:text-xl">
                Victorio ABC
              </span>
              <span className="block text-[11px] font-semibold text-[#7CD5C7] sm:text-xs">
                Animal Bite Center
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden h-10 w-px bg-white/20 sm:block" />

          {/* Multi-Tenant Branch / Server Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="Switch active clinic branch"
              className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-[#7CD5C7]/50 bg-[#343857]/90 px-3 py-1.5 text-left transition hover:border-[#7CD5C7] hover:bg-[#343857]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7CD5C7]/20 text-[#7CD5C7]">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7CD5C7]">
                    Active Branch
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-semibold text-white/80">
                    7 Locations
                  </span>
                </div>
                <p className="max-w-[175px] truncate text-xs font-bold text-white lg:max-w-[210px]">
                  {selectedPublicBranch.shortName}
                </p>
              </div>
              <span className="max-w-[105px] truncate text-xs font-bold text-white sm:hidden">
                {selectedPublicBranch.area}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#7CD5C7] transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#DDDCD4] bg-white p-2 text-[#464B71] shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-[#F2F2ED] px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                    <Server className="h-3.5 w-3.5 text-[#118AB2]" />
                    <span>Select Clinic Branch (7 Official)</span>
                  </div>
                  <Link
                    to="/contact"
                    onClick={() => setDropdownOpen(false)}
                    className="text-[11px] font-bold text-[#118AB2] hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="mt-1 max-h-80 space-y-1 overflow-y-auto pr-0.5">
                  {publicBranches.map((branch) => {
                    const isSelected = branch.slug === selectedPublicBranch.slug;
                    return (
                      <button
                        key={branch.slug}
                        type="button"
                        onClick={() => handleSelectBranch(branch.slug)}
                        className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                          isSelected
                            ? 'bg-[#7CD5C7]/25 ring-1 ring-[#7CD5C7]'
                            : 'hover:bg-[#F2F2ED]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-extrabold text-[#464B71]">
                              {branch.shortName}
                            </p>
                            {isSelected && (
                              <span className="rounded-full bg-[#118AB2] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[#464B71]/75">
                            {branch.address}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-[#118AB2]">
                            Tel: {branch.contactNumber}
                          </p>
                        </div>
                        <div className="mt-1 shrink-0">
                          {isSelected ? (
                            <Check className="h-4 w-4 text-[#118AB2]" />
                          ) : (
                            <span className="text-[10px] font-semibold text-[#464B71]/50">
                              Switch
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links & Portal Sign In */}
        <div className="hidden items-center gap-5 lg:flex">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                    isActive
                      ? 'bg-white/15 text-[#7CD5C7]'
                      : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to={portalPath}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0D6E8E]"
          >
            <span>{portalLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/20 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation & Branch Switcher Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/15 bg-[#343857] px-4 pb-5 pt-3 lg:hidden">
          <div className="mb-3 rounded-xl border border-white/15 bg-[#464B71] p-3">
            <label
              htmlFor="mobile-branch-select"
              className="block text-[10px] font-bold uppercase tracking-wider text-[#7CD5C7]"
            >
              Active Branch / Server Context
            </label>
            <select
              id="mobile-branch-select"
              value={selectedPublicBranch.slug}
              onChange={(e) => handleSelectBranch(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#343857] px-3 py-2 text-xs font-bold text-white focus:border-[#7CD5C7] focus:outline-none"
            >
              {publicBranches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.shortName} ({b.contactNumber})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-white/80">{selectedPublicBranch.address}</p>
          </div>

          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center rounded-xl px-3.5 py-2 text-sm font-bold ${
                    isActive
                      ? 'bg-[#118AB2] text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#7CD5C7] bg-white/10 px-4 py-2.5 text-sm font-bold text-[#7CD5C7]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {selectedPublicBranch.area}</span>
            </a>
            <Link
              to={portalPath}
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-extrabold text-white"
            >
              <span>{portalLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
