import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  PhoneCall,
  Check,
  Menu,
  X,
  CalendarClock,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  LocateFixed,
  Lock,
} from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { formatBranchLabel, formatPhoneDisplay } from '../../config/branches';

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
    subtitle: 'WHO Category I–III exposure breakdown & first-aid guide',
    icon: ShieldCheck,
  },
  {
    to: '/protocols',
    title: 'Clinical Protocols',
    subtitle: 'DOH/WHO PEP, ERIG/HRIG & wound care standards',
    icon: Stethoscope,
  },
  {
    to: '/services',
    title: 'Clinic Services Overview',
    subtitle: 'Walk-in PEP, PrEP, ERIG infiltration & PhilHealth ABTP',
    icon: BookOpen,
  },
];

const GUIDE_PATHS = ['/roadmap', '/triage-guide', '/protocols'];

export function PublicNavbar() {
  const { pathname } = useLocation();
  const {
    publicBranches,
    selectedPublicBranch,
    setSelectedBranchSlug,
    geolocationStatus,
    detectNearestBranch,
  } = useBranch();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [guidesDropdownOpen, setGuidesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileGuidesOpen, setMobileGuidesOpen] = useState(false);

  const branchDropdownRef = useRef(null);
  const guidesDropdownRef = useRef(null);

  const isGuideRouteActive = GUIDE_PATHS.includes(pathname);
  const branchSubtext =
    selectedPublicBranch?.branchLabel || formatBranchLabel(selectedPublicBranch);
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

  const anchorLinkClass =
    'inline-flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold text-white/90 whitespace-nowrap transition hover:bg-white/10 hover:text-[#7CD5C7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/15 bg-[#464B71] text-white shadow-md">
      <div className="flex min-h-[90px] w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:min-h-[104px] lg:px-10 xl:px-14">
        {/* Left Group: Noticeably Larger, Crisper Logo + Minimal Public "You are in:" Branch Selector */}
        <div className="relative flex shrink-0 flex-col items-start" ref={branchDropdownRef}>
          <div className="flex items-center gap-3 sm:gap-3.5">
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-3.5 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[#7CD5C7] bg-white p-0.5 shadow-lg transition group-hover:scale-105 sm:h-16 sm:w-16 lg:h-[68px] lg:w-[68px]">
                <img
                  src="/victorio_logo.jpg"
                  alt="Victorio Animal Bite Center Logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-white whitespace-nowrap sm:text-2xl lg:text-[26px]">
                  Victorio ABC
                </span>
                <span className="block text-xs font-bold text-[#7CD5C7] whitespace-nowrap sm:text-sm">
                  Animal Bite Center
                </span>
              </div>
            </Link>

            <button
              type="button"
              data-testid="navbar-branch-switcher-trigger"
              onClick={() => setBranchDropdownOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={branchDropdownOpen}
              aria-label={`Switch branch (current: ${branchSubtext})`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#7CD5C7] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7CD5C7]"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${
                  branchDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            data-testid="navbar-logo-branch-subtext"
            onClick={() => setBranchDropdownOpen((prev) => !prev)}
            className="mt-1 pl-1 text-left text-[11px] font-medium tracking-wide text-white/80 transition hover:text-[#7CD5C7] focus-visible:outline-none"
          >
            You are in: <span className="font-bold text-[#7CD5C7]">{branchSubtext}</span>
          </button>

          {branchDropdownOpen && (
            <div
              role="menu"
              aria-label="Select Clinic Branch"
              className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#DDDCD4] bg-white p-1.5 text-[#464B71] shadow-2xl sm:w-72"
            >
              <div className="max-h-72 space-y-0.5 overflow-y-auto">
                {publicBranches.map((branch) => {
                  const isSelected = branch.slug === selectedPublicBranch.slug;
                  return (
                    <button
                      key={branch.slug}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelectBranch(branch.slug)}
                      className={`flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#118AB2] ${
                        isSelected
                          ? 'bg-[#7CD5C7]/25 font-extrabold text-[#464B71]'
                          : 'text-[#464B71]/90 hover:bg-[#F2F2ED]'
                      }`}
                    >
                      <span className="truncate">{branch.shortName}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[#118AB2]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 border-t border-[#F2F2ED] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    detectNearestBranch();
                    setBranchDropdownOpen(false);
                  }}
                  className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#118AB2] transition hover:bg-[#EAFBF8]"
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  <span>
                    {geolocationStatus === 'detecting'
                      ? 'Detecting nearest branch…'
                      : 'Detect nearest branch'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Group: Quick Anchor Links, Clinical Guides Dropdown & Discreet Staff Portal Login Button */}
        <nav
          aria-label="Primary Public Navigation"
          className="hidden items-center gap-1 xl:gap-2 lg:flex"
        >
          <a href="/#services" className={anchorLinkClass}>
            Services
          </a>

          <a href="/#mobile-app-guide" className={anchorLinkClass}>
            Mobile App Guide
          </a>

          <a href="/#our-branches" className={anchorLinkClass}>
            Our Branches
          </a>

          <a href="/#partners" className={anchorLinkClass}>
            Partners
          </a>

          {/* Clinical Guides Dropdown */}
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
              className={`inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2] ${
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
                  className="space-y-1 rounded-2xl border border-[#DDDCD4] bg-white p-2 text-[#464B71] shadow-2xl"
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

          <Link
            to="/login"
            data-testid="navbar-staff-login-btn"
            className="ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#7CD5C7]/50 bg-white/10 px-4 py-2 text-xs font-extrabold text-[#7CD5C7] whitespace-nowrap transition hover:bg-[#7CD5C7] hover:text-[#464B71] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Staff Portal Login</span>
          </Link>
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
          <nav className="flex flex-col space-y-1">
            {[
              { href: '/#services', label: 'Services' },
              { href: '/#mobile-app-guide', label: 'Mobile App Guide' },
              { href: '/#our-branches', label: 'Our Branches' },
              { href: '/#partners', label: 'Partners' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]"
              >
                {item.label}
              </a>
            ))}

            {/* Mobile Expandable Clinical Guides Accordion */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#464B71]/60">
              <button
                type="button"
                onClick={() => setMobileGuidesOpen((prev) => !prev)}
                aria-expanded={mobileGuidesOpen}
                className="flex min-h-[48px] w-full items-center justify-between px-3.5 py-2 text-left text-sm font-bold text-[#7CD5C7]"
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
                className="flex min-h-[48px] items-center rounded-xl px-3.5 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-extrabold text-white"
            >
              <Lock className="h-4 w-4" />
              <span>Staff Portal Login</span>
            </Link>
          </nav>

          <div className="mt-3">
            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#7CD5C7] bg-white/10 px-4 py-2.5 text-sm font-bold text-[#7CD5C7]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>
                Call {selectedPublicBranch.shortName} ({formattedActivePhone})
              </span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
