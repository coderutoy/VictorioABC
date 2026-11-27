import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  Plus,
  Minus,
  ChevronDown,
  PhoneCall,
  ArrowRight,
  Stethoscope,
  Droplets,
  Syringe,
  Building2,
  Smartphone,
  X,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { formatPhoneDisplay } from '../config/branches';

const FAQ_CATEGORIES = [
  {
    id: 'all',
    label: 'All Categories',
    icon: HelpCircle,
  },
  {
    id: 'Immediate Bite Care & First Aid',
    label: 'Immediate Bite Care & First Aid',
    icon: Droplets,
  },
  {
    id: 'Vaccination & PEP Schedule',
    label: 'Vaccination & PEP Schedule',
    icon: Syringe,
  },
  {
    id: 'Clinic Visits & Branches',
    label: 'Clinic Visits & Branches',
    icon: Building2,
  },
  {
    id: 'Mobile App & Patient Records',
    label: 'Mobile App & Patient Records',
    icon: Smartphone,
  },
];

const FAQ_ITEMS = [
  // 1. Immediate Bite Care & First Aid
  {
    id: 'first-aid-wash',
    category: 'Immediate Bite Care & First Aid',
    q: 'What should I do immediately after an animal bite or scratch before coming to the clinic?',
    a: 'Immediately flush the bite or scratch wound under strong running tap water and wash thoroughly with soap for at least 15 full minutes. Afterward, gently apply povidone-iodine (Betadine) or 70% ethyl/isopropyl alcohol. Leave the wound open to breathe (avoid tight bandages or home suturing) and proceed directly to the nearest Victorio Animal Bite Center branch.',
  },
  {
    id: 'first-aid-when-to-visit',
    category: 'Immediate Bite Care & First Aid',
    q: 'How soon should I visit an Animal Bite Center after a dog or cat exposure?',
    a: 'You should visit a clinic on the same day as the exposure (Day 0), ideally right after performing 15-minute soap-and-water wound washing. Prompt initiation of Post-Exposure Prophylaxis (PEP) and wound infiltration for deep or bleeding bites is critical before the rabies virus can reach peripheral nerves.',
  },
  {
    id: 'first-aid-tandok',
    category: 'Immediate Bite Care & First Aid',
    q: 'Why should I never use "tandok" (horn suction), garlic, or vinegar on a bite wound?',
    a: 'Traditional horn suction (tandok) or rubbing garlic, vinegar, or herbal poultices onto a bite wound cannot remove or neutralize the rabies virus. Forceful suction damages tissue, pushes viral particles deeper into nerve endings, introduces tetanus spores, and causes dangerous delays in receiving medical Anti-Rabies Vaccine and ERIG.',
  },
  {
    id: 'first-aid-minor-scratch',
    category: 'Immediate Bite Care & First Aid',
    q: 'Do I still need a consultation for a minor puppy or kitten scratch without bleeding?',
    a: 'Yes. Under World Health Organization (WHO) guidelines, even minor superficial scratches or nibbling of uncovered skin without bleeding are classified as Category II exposures and require immediate wound washing and Anti-Rabies Vaccine initiation.',
  },

  // 2. Vaccination & PEP Schedule
  {
    id: 'pep-schedule-days',
    category: 'Vaccination & PEP Schedule',
    q: 'What are the scheduled clinic visits for the Anti-Rabies PEP vaccination series?',
    a: 'For the WHO-approved Updated Thai Red Cross Intradermal (ID) regimen, doses are administered on Day 0 (initial visit), Day 3, Day 7, and Day 28. For the Essen 5-dose Intramuscular (IM) regimen, doses are administered on Day 0, Day 3, Day 7, Day 14, and Day 28. Patients with documented complete prior PEP or PrEP typically receive a 2-dose booster on Day 0 and Day 3.',
  },
  {
    id: 'pep-missed-dose',
    category: 'Vaccination & PEP Schedule',
    q: 'What happens if I miss or delay one of my scheduled PEP doses?',
    a: 'Visit the nearest Victorio ABC branch as soon as possible. In most short delays, you do not need to restart the entire series from Day 0 — our clinic physician and nurse will review your vaccination timeline and adjust your remaining schedule dates safely.',
  },
  {
    id: 'pep-arv-vs-erig',
    category: 'Vaccination & PEP Schedule',
    q: 'What is the difference between Anti-Rabies Vaccine (ARV) and ERIG / HRIG?',
    a: 'Anti-Rabies Vaccine (PVRV / PCECV) stimulates your immune system to produce its own long-lasting active antibodies, which peak around 7 to 14 days after Day 0. Rabies Immunoglobulin (ERIG or HRIG) is infiltrated directly into and around WHO Category III wounds (bleeding bites/scratches, head/neck/hand bites, or mucous membrane exposure) to provide immediate passive neutralizing antibodies during that initial window.',
  },
  {
    id: 'pep-tetanus-pregnancy',
    category: 'Vaccination & PEP Schedule',
    q: 'Are tetanus shots included, and are rabies vaccines safe for children and pregnant women?',
    a: 'Yes. Our physician evaluates every patient for Tetanus Toxoid (TT) and Anti-Tetanus Serum (ATS) prophylaxis alongside rabies care. Modern cell-culture rabies vaccines and RIG have no contraindications and are safe for infants, children, pregnant women, and breastfeeding mothers.',
  },

  // 3. Clinic Visits & Branches
  {
    id: 'branch-walkin-vs-followup',
    category: 'Clinic Visits & Branches',
    q: 'Do I need an appointment or can I walk in for Day 0 and follow-up doses?',
    a: 'Walk-in patients are welcome daily across all 7 Victorio ABC branches for both Day 0 new bite consultations and scheduled follow-up doses. Returning patients are prioritized via fast QR Pass check-in.',
  },
  {
    id: 'branch-what-to-bring',
    category: 'Clinic Visits & Branches',
    q: 'What should I bring to my clinic visit?',
    a: 'Please bring a valid ID (or school/guardian ID for minors), any previous Anti-Rabies or Tetanus vaccination card if you have been immunized before, a list of known allergies or medications, and basic details about the biting animal.',
  },
  {
    id: 'branch-cross-location',
    category: 'Clinic Visits & Branches',
    q: 'Can I take my Day 3, Day 7, or Day 28 follow-up dose at a different Victorio ABC branch?',
    a: 'Yes! All 7 official branches (Baliwag, Santa Maria, Mapulang Lupa Pandi, DRT, Meycauayan Camalig, Poblacion Meycauayan, and Cefels Caloocan) share a synchronized clinical registry. Present your Digital QR Pass at any branch to continue your PEP schedule seamlessly.',
  },

  // 4. Mobile App & Patient Records
  {
    id: 'app-patient-records',
    category: 'Mobile App & Patient Records',
    q: 'How can I view my digital vaccination card, QR pass, and PEP schedule on my phone?',
    a: 'Patient vaccination cards, Digital QR Passes, automated dose reminders, and interactive pre-triage tools are available exclusively inside the Victorio ABC Mobile App. Sign in to the mobile app with your registered patient account to view your real-time Day 0–28 schedule.',
  },
  {
    id: 'app-privacy-security',
    category: 'Mobile App & Patient Records',
    q: 'How is my medical and personal information protected?',
    a: 'In compliance with the Philippine Data Privacy Act of 2012 (RA 10173), sensitive patient contact details, addresses, and identifiers are protected with AES-256-GCM encryption and strict role-based clinical access controls. Zero medical records are ever stored in public browser cookies.',
  },
];

export function FaqPage() {
  const { selectedPublicBranch } = useBranch();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Collapsed by default as requested
  const [openIds, setOpenIds] = useState(() => new Set());

  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const groupedSections = useMemo(() => {
    const categoryNames = FAQ_CATEGORIES.filter((c) => c.id !== 'all');
    return categoryNames
      .map((cat) => ({
        ...cat,
        items: filteredFaqs.filter((item) => item.category === cat.id),
      }))
      .filter((section) => section.items.length > 0);
  }, [filteredFaqs]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
            <HelpCircle className="h-4 w-4" />
            <span>Patient &amp; Family Guidance</span>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-4xl">
            Frequently Asked Questions (FAQ)
          </h1>
          <p className="text-sm leading-relaxed text-white/85 sm:text-base">
            Practical answers on immediate wound first-aid, WHO Day 0–28 PEP vaccination schedules, cross-branch visits across our 7 clinics, and accessing your records in the Victorio ABC mobile app.
          </p>
        </div>
      </div>

      {/* Quick Search & Category Filter Tabs */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 p-5 shadow-sm backdrop-blur-[2px] space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-[#464B71]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search FAQs by keyword (e.g., Day 0, ERIG, missed dose, QR pass, soap wash)..."
            aria-label="Search Frequently Asked Questions"
            className="min-h-[48px] w-full rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 py-2.5 pl-12 pr-10 text-sm font-semibold text-[#464B71] placeholder-[#464B71]/50 transition focus:border-[#118AB2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#118AB2]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-3 top-3 rounded-lg p-1 text-[#464B71]/60 hover:bg-[#DDDCD4] hover:text-[#464B71]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="FAQ Categories"
          className="flex flex-wrap items-center gap-2"
        >
          {FAQ_CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = selectedCategory === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(id)}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  isActive
                    ? 'bg-[#464B71] text-[#7CD5C7] shadow-sm'
                    : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Expandable Accordions (Collapsed by Default) */}
      {groupedSections.length === 0 ? (
        <div className="rounded-3xl border border-[#DDDCD4] bg-white/95 p-10 text-center space-y-3">
          <p className="text-base font-extrabold text-[#464B71]">
            No questions matched &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-[#464B71]/75">
            Try clearing your search filter or switch to &ldquo;All Categories&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white"
          >
            Reset FAQ Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSections.map(({ id: sectionId, label, icon: SectionIcon, items }) => (
            <section key={sectionId} className="space-y-3.5">
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#118AB2] text-white shadow-xs">
                  <SectionIcon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-extrabold text-[#464B71] sm:text-xl">
                  {label}
                </h2>
                <span className="rounded-full bg-[#7CD5C7]/40 px-2.5 py-0.5 text-xs font-extrabold text-[#464B71]">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const isOpen = openIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`overflow-hidden rounded-2xl border-2 bg-white/95 shadow-xs transition ${
                        isOpen
                          ? 'border-[#118AB2] ring-2 ring-[#7CD5C7]/40'
                          : 'border-[#DDDCD4] hover:border-[#464B71]/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                        className="flex min-h-[58px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-extrabold text-[#464B71] transition hover:bg-[#F2F2ED]/50 sm:text-base"
                      >
                        <span className="leading-snug">{item.q}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                              isOpen
                                ? 'bg-[#118AB2] text-white'
                                : 'bg-[#F2F2ED] text-[#464B71]'
                            }`}
                          >
                            {isOpen ? (
                              <Minus className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#118AB2] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-[#F2F2ED] bg-[#F2F2ED]/40 px-5 py-4 text-xs leading-relaxed text-[#464B71]/90 sm:text-sm">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Bottom Callout Linking to /protocols and /contact */}
      <div className="rounded-3xl border-2 border-[#7CD5C7] bg-white/95 p-6 shadow-md sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <span className="inline-block rounded-full bg-[#7CD5C7]/35 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              Need Detailed Clinical Guidance?
            </span>
            <h2 className="text-lg font-extrabold text-[#464B71] sm:text-xl">
              Review Our WHO Clinical Protocols or Contact {selectedPublicBranch.shortName}
            </h2>
            <p className="text-xs text-[#464B71]/80 sm:text-sm">
              {selectedPublicBranch.address} &bull; Direct Hotline: <strong>{formattedPhone}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/protocols"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#464B71] bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] transition hover:bg-[#464B71] hover:text-white"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Clinical Protocols</span>
            </Link>

            <a
              href={`tel:${selectedPublicBranch.contactNumber}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-4 py-2.5 text-xs font-extrabold text-[#464B71] transition hover:bg-[#68c7b8]"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {formattedPhone}</span>
            </a>

            <Link
              to="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
            >
              <span>Contact &amp; All 7 Branches</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
