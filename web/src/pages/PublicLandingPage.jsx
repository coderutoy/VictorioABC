import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  PhoneCall,
  MapPin,
  Clock,
  Syringe,
  AlertTriangle,
  Stethoscope,
  Droplets,
  QrCode,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SERVICES = [
  {
    title: 'Post-Exposure Prophylaxis (PEP)',
    badge: 'Day 0 • 3 • 7 • 14/28',
    icon: Syringe,
    description:
      'WHO-approved Anti-Rabies Vaccination (PVRV / PCECV) via Updated Thai Red Cross Intradermal (ID) or Essen Intramuscular (IM) regimens for animal bite and scratch exposures.',
  },
  {
    title: 'ERIG / HRIG Wound Infiltration',
    badge: 'WHO Category III',
    icon: HeartPulse,
    description:
      'Immediate Equine (40 IU/kg) or Human (20 IU/kg) Rabies Immunoglobulin infiltration directly into and around deep, bleeding, or multiple transdermal bite wounds.',
  },
  {
    title: 'Pre-Exposure Prophylaxis (PrEP) & Boosters',
    badge: 'Preventive Care',
    icon: ShieldCheck,
    description:
      'Preventive rabies immunization for pet owners, animal handlers, veterinarians, and children, plus rapid 2-dose (Day 0 & Day 3) booster regimens for previously immunized patients.',
  },
  {
    title: 'Tetanus Toxoid & Medical Wound Care',
    badge: 'TT / ATS / HTIG',
    icon: Stethoscope,
    description:
      'Antiseptic wound irrigation, Tetanus Toxoid (0.5 mL IM), and Anti-Tetanus Serum / Immunoglobulin prophylaxis with 14-day biting animal observation guidance.',
  },
];

const FIRST_AID_STEPS = [
  {
    step: '01',
    title: 'Wash With Soap & Running Water for 15 Minutes',
    detail:
      'Immediately flush the bite or scratch wound under strong running tap water and wash thoroughly with soap for at least 15 full minutes to mechanically remove saliva and viral particles.',
  },
  {
    step: '02',
    title: 'Apply Povidone-Iodine or 70% Alcohol',
    detail:
      'After washing and rinsing, gently dab the wound with povidone-iodine (Betadine) or 70% isopropyl/ethyl alcohol to disinfect the exposure site.',
  },
  {
    step: '03',
    title: 'Do Not Cover Tightly & Never Apply Tandok or Garlic',
    detail:
      'Leave the wound open to air or cover lightly with sterile gauze. Never suture tightly, and never use traditional horn suction (tandok), garlic, vinegar, or crushed herbs.',
  },
  {
    step: '04',
    title: 'Visit Victorio Animal Bite Center Immediately',
    detail:
      'Proceed to our Tungkong Mangga Main or Muzon Branch for physician WHO Category I–III classification, Day 0 Anti-Rabies Vaccine, ERIG infiltration, and your Digital QR Pass.',
  },
];

const WHO_CATEGORIES = [
  {
    category: 'WHO Category I',
    level: 'No Exposure',
    tone: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
    badgeClass: 'bg-emerald-600 text-white',
    criteria:
      'Touching or feeding animals, animal licks on intact unbroken skin (no scratches or mucous contact).',
    action:
      'Thorough washing of exposed skin with soap and water for 15 minutes. No vaccine or ERIG required unless clinically indicated.',
  },
  {
    category: 'WHO Category II',
    level: 'Minor / Superficial Exposure',
    tone: 'border-amber-300 bg-amber-50/70 text-amber-900',
    badgeClass: 'bg-amber-600 text-white',
    criteria:
      'Nibbling of uncovered skin, minor scratches or superficial abrasions without spontaneous bleeding.',
    action:
      'Immediate 15-minute wound washing + Start Anti-Rabies Vaccine PEP schedule immediately (Day 0, Day 3, Day 7, Day 14/28).',
  },
  {
    category: 'WHO Category III',
    level: 'Severe / Transdermal Exposure',
    tone: 'border-red-300 bg-red-50/70 text-red-900',
    badgeClass: 'bg-red-600 text-white',
    criteria:
      'Single or multiple transdermal bites or scratches with bleeding, licks on broken skin or mucous membranes, head/neck/hand bites, or any exposure to bats.',
    action:
      'Immediate 15-minute wound washing + Start Anti-Rabies Vaccine PEP schedule + Immediate ERIG/HRIG wound infiltration + Anti-Tetanus prophylaxis.',
  },
];

const BRANCHES = [
  {
    name: 'Victorio ABC — Tungkong Mangga Main',
    barangay: 'Brgy. Tungkong Mangga',
    address: 'Quirino Highway, Brgy. Tungkong Mangga, San Jose del Monte, Bulacan',
    phone: '+63-917-555-0101',
    hours: 'Mon – Sat: 8:00 AM – 5:00 PM • Sun: 8:00 AM – 12:00 NN',
    services: ['PEP & PrEP Vaccination', 'Category III ERIG/HRIG', 'Tetanus Toxoid', 'QR Pass Registration'],
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=14.7915,121.0772',
  },
  {
    name: 'Victorio ABC — Muzon Branch',
    barangay: 'Brgy. Muzon',
    address: 'Muzon Crossing, Brgy. Muzon, San Jose del Monte, Bulacan',
    phone: '+63-917-555-0102',
    hours: 'Mon – Sat: 8:00 AM – 5:00 PM • Sun: Closed (Visit Main Branch)',
    services: ['PEP & PrEP Vaccination', 'Cross-Branch Follow-up Doses', 'Tetanus Toxoid', 'QR Pass Check-In'],
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=14.8124,121.0449',
  },
];

const FAQS = [
  {
    q: 'What are the exact days for the Anti-Rabies PEP vaccination schedule?',
    a: 'For the WHO-approved Intradermal (Updated Thai Red Cross) regimen, doses are administered on Day 0 (first visit), Day 3, Day 7, and Day 28. For the Intramuscular (Essen 5-dose) regimen, doses are given on Day 0, Day 3, Day 7, Day 14, and Day 28. Patients with documented prior complete PEP typically receive a 2-dose booster on Day 0 and Day 3.',
  },
  {
    q: 'Can I receive my Day 3 or Day 7 dose at a different Victorio ABC branch?',
    a: 'Yes. Every patient receives a Global Victorio ABC Digital QR Pass upon Day 0 registration. You can present your QR Pass at either Tungkong Mangga Main or Muzon Branch and our nurses will pull up your encrypted PEP record immediately.',
  },
  {
    q: 'What should I do if I miss or delay a scheduled PEP dose?',
    a: 'Visit the nearest Victorio ABC branch as soon as possible. Do not restart the entire series from the beginning in most short delays — our clinic physician will evaluate your timeline and adjust your remaining schedule safely.',
  },
  {
    q: 'Are anti-rabies vaccines and ERIG safe for children and pregnant or breastfeeding mothers?',
    a: 'Yes. Modern cell-culture rabies vaccines (PVRV / PCECV) and Rabies Immunoglobulin are safe and life-saving for infants, children, and pregnant or breastfeeding women. Because rabies is virtually 100% fatal once symptoms appear, pregnancy is never a contraindication to PEP.',
  },
  {
    q: 'Why should we avoid "tandok", garlic, or vinegar on animal bites?',
    a: 'Tandok (suction with an animal horn), rubbing garlic, or pouring vinegar does not draw out or kill the rabies virus. Instead, forceful suction and unsterile instruments push viral particles deeper into nerve endings, cause severe secondary bacterial infection, and delay life-saving vaccination.',
  },
];

export function PublicLandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [selectedWhoTab, setSelectedWhoTab] = useState(2); // Default highlight Category III

  const portalPath = isAuthenticated ? '/dashboard' : '/login';
  const portalLabel = isAuthenticated ? 'Open Clinical Dashboard' : 'Portal Sign In';

  return (
    <div className="min-h-screen bg-[#F2F2ED] text-[#464B71]">
      {/* Top Emergency Public Health Bar */}
      <div className="bg-[#343857] px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#7CD5C7]" />
            <span className="font-medium">
              San Jose del Monte Animal Bite Hotline &amp; Walk-In PEP Center &bull; DOH / WHO Protocol Aligned
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+639175550101"
              className="inline-flex items-center gap-1 font-semibold text-[#7CD5C7] hover:underline"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>+63 917 555 0101 (Tungkong Mangga)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1. Responsive Header & Mobile Navigation Drawer */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#464B71] text-white shadow-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio Animal Bite Center Logo"
              className="h-12 w-12 rounded-full border-2 border-[#7CD5C7] bg-white object-cover shadow-sm"
            />
            <div>
              <span className="block text-base font-extrabold tracking-tight text-white sm:text-lg">
                Victorio Animal Bite Center
              </span>
              <span className="block text-xs font-medium text-[#7CD5C7]">
                San Jose del Monte, Bulacan
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/90 md:flex">
            <a href="#services" className="transition hover:text-[#7CD5C7]">
              Services
            </a>
            <a href="#first-aid" className="transition hover:text-[#7CD5C7]">
              First Aid
            </a>
            <a href="#who-guide" className="transition hover:text-[#7CD5C7]">
              WHO Categories
            </a>
            <a href="#branches" className="transition hover:text-[#7CD5C7]">
              Branches
            </a>
            <a href="#faq" className="transition hover:text-[#7CD5C7]">
              FAQ
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="tel:+639175550101"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#7CD5C7]/60 bg-white/10 px-3.5 py-2 text-xs font-bold text-[#7CD5C7] transition hover:bg-white/20"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Emergency Call</span>
            </a>
            <Link
              to={portalPath}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0D6E8E]"
            >
              <span>{portalLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 p-2.5 text-white hover:bg-white/20 md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/15 bg-[#343857] px-4 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col space-y-1 text-sm font-semibold">
              {[
                { href: '#services', label: 'Services & Vaccination' },
                { href: '#first-aid', label: '15-Minute First-Aid Guide' },
                { href: '#who-guide', label: 'WHO Exposure Categories (I–III)' },
                { href: '#branches', label: 'SJDM Clinic Branches' },
                { href: '#faq', label: 'Frequently Asked Questions' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-white/90 hover:bg-white/10 hover:text-[#7CD5C7]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <a
                href="tel:+639175550101"
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#7CD5C7] bg-white/10 px-4 py-2.5 text-sm font-bold text-[#7CD5C7]"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Call Emergency Hotline</span>
              </a>
              <Link
                to={portalPath}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-sm font-bold text-white"
              >
                <span>{portalLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Mobile-First) */}
      <section id="top" className="relative overflow-hidden bg-[#464B71] py-12 text-white sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
                <ShieldCheck className="h-4 w-4" />
                <span>DOH &amp; WHO-Aligned Multi-Branch Animal Bite Treatment Center</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Victorio Animal Bite Center —{' '}
                <span className="text-[#7CD5C7]">San Jose del Monte, Bulacan</span>
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                Immediate, compassionate, and physician-supervised Anti-Rabies Post-Exposure Prophylaxis (PEP), ERIG/HRIG wound infiltration, and Tetanus protection — connected across our Tungkong Mangga and Muzon branches with your personal Digital QR Pass.
              </p>

              {/* Operating Hours & Location Trust Badges */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-3.5">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#7CD5C7]" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Clinic Operating Hours</p>
                    <p className="mt-0.5 text-white/80">
                      Mon – Sat: 8:00 AM – 5:00 PM
                    </p>
                    <p className="text-[#7CD5C7]">
                      Sun (Tungkong Mangga Main): 8:00 AM – 12:00 NN
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-3.5">
                  <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-[#7CD5C7]" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Cross-Branch Digital QR Pass</p>
                    <p className="mt-0.5 text-white/80">
                      Start Day 0 at one branch and seamlessly take Day 3, 7, or 28 at any Victorio ABC location.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dual CTAs */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <a
                  href="#first-aid"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-6 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
                >
                  <Droplets className="h-4 w-4" />
                  <span>Emergency First-Aid Guide</span>
                </a>
                <Link
                  to={portalPath}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E]"
                >
                  <span>{isAuthenticated ? 'Go to Clinical Portal' : 'Sign In to Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Hero Right Column: Immediate Exposure Action Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-xl">
                <div className="flex items-center gap-3 border-b border-[#DDDCD4] pb-4">
                  <img
                    src="/victorio_logo.jpg"
                    alt="Victorio ABC Emblem"
                    className="h-14 w-14 rounded-full border-2 border-[#118AB2] object-cover"
                  />
                  <div>
                    <span className="inline-block rounded-full bg-[#7CD5C7]/35 px-2.5 py-0.5 text-[11px] font-bold text-[#464B71]">
                      WALK-INS WELCOME DAILY
                    </span>
                    <h2 className="mt-0.5 text-lg font-extrabold text-[#464B71]">
                      Bitten or Scratched by a Dog or Cat?
                    </h2>
                  </div>
                </div>

                <ul className="mt-4 space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>
                      <strong>Step 1:</strong> Wash the wound with soap and running water for{' '}
                      <strong>15 minutes</strong> right now.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>
                      <strong>Step 2:</strong> Apply povidone-iodine or 70% alcohol. Do{' '}
                      <strong>not</strong> apply garlic, vinegar, or <em>tandok</em>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>
                      <strong>Step 3:</strong> Visit Victorio ABC in <strong>Tungkong Mangga</strong> or{' '}
                      <strong>Muzon</strong> for Day 0 PEP vaccination.
                    </span>
                  </li>
                </ul>

                <div className="mt-5 rounded-xl bg-[#F2F2ED] p-3.5 text-xs">
                  <p className="font-bold text-[#464B71]">
                    Standard WHO PEP Schedule Days:
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center font-bold">
                    {['Day 0', 'Day 3', 'Day 7', 'Day 28'].map((d) => (
                      <div
                        key={d}
                        className="rounded-lg border border-[#DDDCD4] bg-white py-1.5 text-[#118AB2]"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="#branches"
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#343857]"
                  >
                    <MapPin className="h-4 w-4 text-[#7CD5C7]" />
                    <span>Find Nearest SJDM Branch</span>
                  </a>
                  <a
                    href="tel:+639175550101"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#118AB2] px-4 py-2 text-xs font-bold text-[#118AB2] transition hover:bg-[#E6F5FA]"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call Clinic</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Services & Vaccination Overview */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#464B71]">
            Clinical Rabies &amp; Bite Care Services
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
            Complete WHO-Aligned Rabies Prophylaxis &amp; Wound Care
          </h2>
          <p className="mt-2 text-sm text-[#464B71]/80 sm:text-base">
            Every patient encounter is evaluated by our licensed physicians and tracked through our multi-branch electronic medical record and cold-chain inventory system.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ title, badge, icon: Icon, description }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-[#7CD5C7]/35 px-2.5 py-0.5 text-[11px] font-bold text-[#464B71]">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#464B71]">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#464B71]/80 sm:text-sm">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Interactive Animal Bite First-Aid & WHO Category Guide */}
      <section id="first-aid" className="border-y border-[#DDDCD4] bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-block rounded-full bg-[#118AB2]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#118AB2]">
                Immediate First-Aid Protocol
              </span>
              <h2 className="text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                What to Do Immediately After an Animal Bite or Scratch
              </h2>
              <p className="text-sm leading-relaxed text-[#464B71]/80">
                Proper wound washing within the first minutes of exposure reduces viral load at the bite site by up to 50% before you even arrive at the clinic.
              </p>

              {/* Prominent Public-Health Safety Warning Against Tandok */}
              <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-red-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                  <div className="text-xs leading-relaxed sm:text-sm">
                    <p className="font-extrabold uppercase tracking-wide text-red-700">
                      Public Health Warning: Never Use &ldquo;Tandok&rdquo; or Garlic
                    </p>
                    <p className="mt-1">
                      Traditional suction horns (<em>tandok</em>), rubbing garlic, vinegar, or herbal poultices <strong>do not cure or prevent rabies</strong>. They cause severe tissue trauma, introduce tetanus spores, and lead to fatal delays in receiving WHO-approved Anti-Rabies Vaccine and ERIG.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              {FIRST_AID_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/70 p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#464B71] font-mono text-xs font-bold text-[#7CD5C7]">
                      {item.step}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#464B71]">{item.title}</h3>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive WHO Category I, II, III Breakdown */}
          <div id="who-guide" className="pt-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-block rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#464B71]">
                  WHO Rabies Exposure Classification
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-[#464B71] sm:text-2xl">
                  Understanding WHO Categories I, II, and III
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {WHO_CATEGORIES.map((item, idx) => (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => setSelectedWhoTab(idx)}
                    className={`min-h-[42px] rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      selectedWhoTab === idx
                        ? 'bg-[#118AB2] text-white shadow-sm'
                        : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
                    }`}
                  >
                    {item.category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {WHO_CATEGORIES.map((item, idx) => {
                const isHighlighted = selectedWhoTab === idx;
                return (
                  <div
                    key={item.category}
                    onClick={() => setSelectedWhoTab(idx)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition ${
                      item.tone
                    } ${isHighlighted ? 'ring-2 ring-[#464B71] shadow-md' : 'opacity-90'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold">{item.category}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.badgeClass}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider opacity-75">
                      Exposure Criteria:
                    </p>
                    <p className="mt-1 text-xs leading-relaxed sm:text-sm">{item.criteria}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider opacity-75">
                      Required Clinical Management:
                    </p>
                    <p className="mt-1 text-xs font-bold leading-relaxed sm:text-sm">
                      {item.action}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Multi-Branch Directory (San Jose del Monte) */}
      <section id="branches" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#464B71]">
            San Jose del Monte, Bulacan Locations
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
            Visit Our Connected Victorio ABC Clinic Branches
          </h2>
          <p className="mt-2 text-sm text-[#464B71]/80">
            Both branches share a unified patient registry and cold-chain vaccine inventory so you can complete your PEP doses at whichever branch is closest to you.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {BRANCHES.map((branch) => (
            <div
              key={branch.name}
              className="flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-bold text-[#464B71]">
                    {branch.barangay}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active Walk-In Clinic
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-[#464B71]">{branch.name}</h3>

                <div className="space-y-2 text-xs text-[#464B71]/85 sm:text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{branch.hours}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{branch.phone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {branch.services.map((svc) => (
                    <span
                      key={svc}
                      className="rounded-lg bg-[#F2F2ED] px-2.5 py-1 text-xs font-semibold text-[#464B71]"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <a
                  href={`tel:${branch.phone}`}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0D6E8E]"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Call {branch.phone}</span>
                </a>
                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-4 py-2.5 text-xs font-bold text-[#464B71] transition hover:bg-[#DDDCD4]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Public FAQ & Deep Slate Navy Footer */}
      <section id="faq" className="border-t border-[#DDDCD4] bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#7CD5C7]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#464B71]">
              Patient &amp; Family Guidance
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-[#464B71] hover:bg-[#F2F2ED] sm:text-base"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#118AB2] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#DDDCD4] bg-white px-5 py-4 text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer (#464B71 Deep Slate Navy) */}
      <footer className="bg-[#464B71] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="/victorio_logo.jpg"
                  alt="Victorio Animal Bite Center Logo"
                  className="h-11 w-11 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
                />
                <div>
                  <p className="text-base font-extrabold text-white">
                    Victorio Animal Bite Center
                  </p>
                  <p className="text-xs text-[#7CD5C7]">
                    San Jose del Monte, Bulacan • Multi-Branch Rabies Care
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-white/80">
                Dedicated to eliminating human rabies in San Jose del Monte through accessible WHO-guided Post-Exposure Prophylaxis, cold-chain assured vaccines, and cross-branch digital patient tracking.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#7CD5C7]">
                Quick Navigation
              </p>
              <ul className="space-y-1.5 text-white/85">
                <li>
                  <a href="#services" className="hover:text-[#7CD5C7]">
                    PEP &amp; ERIG Services
                  </a>
                </li>
                <li>
                  <a href="#first-aid" className="hover:text-[#7CD5C7]">
                    15-Minute First-Aid Guide
                  </a>
                </li>
                <li>
                  <a href="#who-guide" className="hover:text-[#7CD5C7]">
                    WHO Exposure Categories
                  </a>
                </li>
                <li>
                  <a href="#branches" className="hover:text-[#7CD5C7]">
                    Tungkong Mangga &amp; Muzon Branches
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#7CD5C7]">
                    Patient FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#7CD5C7]">
                Clinical Staff &amp; Patient Portal
              </p>
              <p className="text-white/80">
                Authorized Doctors, Nurses, and Central Admins can sign in below to access the Phase 2 Patient Registry, QR Check-In Triage Queue, and Clinical Orders dashboard.
              </p>
              <Link
                to={portalPath}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0D6E8E]"
              >
                <span>{portalLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/15 pt-6 text-xs text-white/70 sm:flex-row">
            <span>
              &copy; {new Date().getFullYear()} Victorio Animal Bite Center (San Jose del Monte, Bulacan). All rights reserved.
            </span>
            <span>
              AES-256-GCM Protected EMR &bull; WHO Rabies PEP Protocol
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
