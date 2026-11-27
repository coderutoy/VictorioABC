import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  PhoneCall,
  Check,
  Menu,
  X,
  Server,
  CalendarClock,
  ShieldCheck,
  Stethoscope,
  BookOpen,
} from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { formatPhoneDisplay } from '../../config/branches';
import { AccessibilityToolbar } from './AccessibilityToolbar';

const CLINICAL_GUIDE_ITEMS = [
  {
    to: '/roadmap',
    title: 'Vaccination Roadmap',
    subtitle: 'Patient journey & PEP Day 0–28 milestones',
    icon: CalendarClock,
  },
  {
    to: '/triage-guide',
    title: 'Triage Guide',
    subtitle: 'WHO Category I–III exposure breakdown & pre-check',
    icon: ShieldCheck,
  },
  {
    to: '/protocols',
    title: 'Clinical Protocols',
    subtitle: 'DOH/WHO PEP, ERIG/HRIG & wound care standards',
    icon: Stethoscope,
  },
  {
    to: '/#clinical-guides',
    title: 'Dedicated Clinical Guides',
    subtitle: 'Complete overview of emergency bite care, schedules & protocols',
    icon: BookOpen,
  },
];

const GUIDE_PATHS = ['/roadmap', '/triage-guide', '/protocols'];

export function PublicNavbar() {
  const { pathname } = useLocation();
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileGuidesOpen, setMobileGuidesOpen] = useState(false);

  const branchDropdownRef = useRef(null);
  const guidesDropdownRef = useRef(null);

  const isGuideRouteActive = GUIDE_PATHS.includes(pathname);
  const formattedActivePhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  useEffect(() => {
    function handleClickOutside(e) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false);
      }
      if (guidesDropdownRef.current && !guidesDropdownRef.current.contains(e.target)) {
        setGuidesDropdownOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setBranchDropdownOpen(false);
        setGuidesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectBranch = (slug) => {
    setSelectedBranchSlug(slug);
    setBranchDropdownOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex min-h-[48px] items-center rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${
      isActive
        ? 'bg-white/15 text-[#7CD5C7]'
        : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/15 bg-[#464B71] text-white shadow-md">
      {/* Full-Width Top Active Branch Strip */}
      <div className="w-full border-b border-white/10 bg-[#343857] px-4 py-1.5 text-xs text-white/90 sm:px-6 lg:px-10 xl:px-14">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#7CD5C7]" />
            <span className="font-semibold text-[#7CD5C7]">
              Active Branch ({selectedPublicBranch.shortName}):
            </span>
            <span className="truncate text-white/85">{selectedPublicBranch.address}</span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex items-center gap-1 font-bold text-[#7CD5C7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7CD5C7] rounded"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>{formattedActivePhone}</span>
            </a>
            <a
              href={selectedPublicBranch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-white/80 hover:text-[#7CD5C7] hover:underline"
            >
              Directions &rarr;
            </a>
            <AccessibilityToolbar />
          </div>
        </div>
      </div>

      {/* Full-Width Main Header Row (Portal Sign In removed from header; kept on Home & Footer) */}
      <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:h-24 lg:px-10 xl:px-14">
        {/* Left Group: Circular Logo + Brand Title + Multi-Tenant Branch Switcher */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#7CD5C7] bg-white p-0.5 shadow-md transition group-hover:scale-105 sm:h-14 sm:w-14">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio Animal Bite Center Logo"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-white whitespace-nowrap sm:text-xl">
                Victorio ABC
              </span>
              <span className="block text-[11px] font-semibold text-[#7CD5C7] whitespace-nowrap sm:text-xs">
                Animal Bite Center
              </span>
            </div>
          </Link>

          <div className="hidden h-10 w-px bg-white/20 sm:block" />

          {/* Multi-Tenant Branch / Server Switcher Dropdown */}
          <div className="relative" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => setBranchDropdownOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={branchDropdownOpen}
              aria-label="Switch active clinic branch"
              className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-[#7CD5C7]/50 bg-[#343857]/90 px-3.5 py-1.5 text-left transition hover:border-[#7CD5C7] hover:bg-[#343857] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
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
                <p className="max-w-[180px] truncate text-xs font-bold text-white xl:max-w-[230px]">
                  {selectedPublicBranch.shortName}
                </p>
              </div>
              <span className="max-w-[100px] truncate text-xs font-bold text-white sm:hidden">
                {selectedPublicBranch.area}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#7CD5C7] transition-transform ${
                  branchDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {branchDropdownOpen && (
              <div
                role="menu"
                aria-label="Select Clinic Branch"
                className="absolute left-0 z-50 mt-2 w-80 rounded-2xl border border-[#DDDCD4] bg-white p-2 text-[#464B71] shadow-2xl sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-[#F2F2ED] px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
                    <Server className="h-3.5 w-3.5 text-[#118AB2]" />
                    <span>Select Clinic Branch (7 Official)</span>
                  </div>
                  <Link
                    to="/contact"
                    onClick={() => setBranchDropdownOpen(false)}
                    className="text-[11px] font-bold text-[#118AB2] hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="mt-1 max-h-80 space-y-1 overflow-y-auto pr-0.5">
                  {publicBranches.map((branch) => {
                    const isSelected = branch.slug === selectedPublicBranch.slug;
                    const displayTel =
                      branch.displayPhone || formatPhoneDisplay(branch.contactNumber);
                    return (
                      <button
                        key={branch.slug}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelectBranch(branch.slug)}
                        className={`flex min-h-[48px] w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${
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
                            Tel: {displayTel}
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

        {/* Right Group: Well-Spaced Navigation Links + Single Clinical Guides Dropdown */}
        <nav
          aria-label="Primary Public Navigation"
          className="hidden items-center gap-1.5 xl:gap-2.5 lg:flex"
        >
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/services" className={navLinkClass}>
            Services
          </NavLink>

          {/* Single "Clinical Guides" Dropdown Menu */}
          <div
            className="relative"
            ref={guidesDropdownRef}
            onMouseEnter={() => setGuidesDropdownOpen(true)}
            onMouseLeave={() => setGuidesDropdownOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={guidesDropdownOpen}
              onClick={() => setGuidesDropdownOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setGuidesDropdownOpen(false);
              }}
              className={`inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${
                isGuideRouteActive || guidesDropdownOpen
                  ? 'bg-white/15 text-[#7CD5C7]'
                  : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
              }`}
            >
              <span>Clinical Guides</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#7CD5C7] transition-transform ${
                  guidesDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {guidesDropdownOpen && (
              <div className="absolute right-0 top-full z-50 w-80 pt-2">
                <div
                  role="menu"
                  aria-label="Clinical Guides Submenu"
                  className="rounded-2xl border border-[#DDDCD4] bg-white p-2 text-[#464B71] shadow-2xl space-y-1"
                >
                  {CLINICAL_GUIDE_ITEMS.map(({ to, title, subtitle, icon: Icon }) => {
                    const isActiveChild = pathname === to;
                    return (
                      <Link
                        key={title}
                        to={to}
                        role="menuitem"
                        onClick={() => setGuidesDropdownOpen(false)}
                        className={`flex min-h-[48px] items-start gap-3 rounded-xl px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${
                          isActiveChild
                            ? 'bg-[#7CD5C7]/30 text-[#464B71] ring-1 ring-[#7CD5C7]'
                            : 'hover:bg-[#F2F2ED]'
                        }`}
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#118AB2]/10 text-[#118AB2]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-[#464B71]">{title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#464B71]/75">
                            {subtitle}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>

          <NavLink to="/faq" className={navLinkClass}>
            FAQ
          </NavLink>

          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
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
              className="mt-1.5 min-h-[48px] w-full rounded-lg border border-white/20 bg-[#343857] px-3 py-2 text-xs font-bold text-white focus:border-[#7CD5C7] focus:outline-none"
            >
              {publicBranches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.shortName} ({b.displayPhone || formatPhoneDisplay(b.contactNumber)})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-white/80">{selectedPublicBranch.address}</p>
          </div>

          <nav className="flex flex-col space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold ${
                  isActive
                    ? 'bg-[#118AB2] text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold ${
                  isActive
                    ? 'bg-[#118AB2] text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]'
                }`
              }
            >
              Services
            </NavLink>

            {/* Mobile Expandable Clinical Guides Accordion */}
            <div className="rounded-xl border border-white/10 bg-[#464B71]/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileGuidesOpen((prev) => !prev)}
                aria-expanded={mobileGuidesOpen}
                className="flex min-h-[48px] w-full items-center justify-between px-3.5 py-2 text-left text-sm font-bold text-[#7CD5C7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
              >
                <span>Clinical Guides</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileGuidesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileGuidesOpen && (
                <div className="space-y-1 border-t border-white/10 bg-[#343857]/80 p-2">
                  {CLINICAL_GUIDE_ITEMS.map(({ to, title, subtitle, icon: Icon }) => (
                    <Link
                      key={title}
                      to={to}
                      onClick={() => {
                        setMobileGuidesOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 text-white/90 hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                      <div>
                        <p className="text-xs font-extrabold text-white">{title}</p>
                        <p className="text-[11px] text-white/75">{subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {[
              { to: '/about', label: 'About' },
              { to: '/faq', label: 'FAQ' },
              { to: '/contact', label: 'Contact' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold ${
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

          <div className="mt-4">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#7CD5C7] bg-white/10 px-4 py-2.5 text-sm font-bold text-[#7CD5C7]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {selectedPublicBranch.shortName} ({formattedActivePhone})</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
