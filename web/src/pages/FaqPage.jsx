import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, PhoneCall, ArrowRight } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const FAQ_ITEMS = [
  {
    category: 'Schedules',
    q: 'What are the exact days for the Anti-Rabies PEP vaccination schedule?',
    a: 'For the WHO-approved Intradermal (Updated Thai Red Cross) regimen, doses are administered on Day 0 (your initial visit), Day 3, Day 7, and Day 28. For the Intramuscular (Essen 5-dose) regimen, doses are administered on Day 0, Day 3, Day 7, Day 14, and Day 28. Patients with documented complete prior PEP typically require a 2-dose booster on Day 0 and Day 3.',
  },
  {
    category: 'Branches',
    q: 'Can I take my Day 3, Day 7, or Day 28 follow-up dose at a different Victorio ABC branch?',
    a: 'Yes! All 7 official Victorio ABC branches (Baliwag, Santa Maria, Mapulang Lupa Pandi, DRT, Meycauayan Camalig, Meycauayan Poblacion, and Cefels Caloocan) are connected via our Global Patient Registry. Simply present your Digital QR Pass at arrival.',
  },
  {
    category: 'Schedules',
    q: 'What happens if I miss or delay one of my scheduled PEP doses?',
    a: 'Visit the nearest Victorio ABC branch as soon as possible. In most short delays, you do not need to restart the entire series from Day 0 — our clinic physician and nurse will evaluate your record and safely reschedule your remaining doses.',
  },
  {
    category: 'Safety',
    q: 'Are anti-rabies vaccines and ERIG safe for pregnant women, breastfeeding mothers, and young children?',
    a: 'Yes. Modern cell-culture anti-rabies vaccines (PVRV / PCECV) and Rabies Immunoglobulin (ERIG/HRIG) are safe and life-saving for infants, children, pregnant women, and breastfeeding mothers. Because rabies is fatal once symptoms appear, pregnancy is never a contraindication.',
  },
  {
    category: 'First Aid',
    q: 'How should I wash an animal bite or scratch wound at home before coming to the clinic?',
    a: 'Immediately flush the wound under strong running tap water and wash thoroughly with soap for at least 15 full minutes. Afterward, apply povidone-iodine (Betadine) or 70% alcohol. Do not suture or cover the wound tightly.',
  },
  {
    category: 'First Aid',
    q: 'Why is "tandok" (horn suction) or applying garlic and vinegar dangerous?',
    a: 'Tandok, garlic, vinegar, or herbal poultices cannot neutralize or remove the rabies virus. Forceful suction and unsterile cuts push viral particles deeper into peripheral nerves, introduce severe bacterial or tetanus infections, and cause life-threatening delays in medical vaccination.',
  },
  {
    category: 'Branches',
    q: 'Do I need an appointment or can I walk in directly?',
    a: 'Walk-in patients are welcome daily at all 7 Victorio ABC branches. Upon registration, you will receive a queue ticket and your personal Digital QR Pass for fast follow-up check-ins.',
  },
];

export function FaqPage() {
  const { selectedPublicBranch } = useBranch();
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-9">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
          <HelpCircle className="h-4 w-4" />
          <span>Patient &amp; Family Guidance</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="mt-2 text-sm text-white/85">
          Answers to common questions about PEP schedules, missed doses, pregnancy/child safety, first-aid washing, and cross-branch visits.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-[#DDDCD4] bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="flex min-h-[54px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-extrabold text-[#464B71] hover:bg-[#F2F2ED]/60 sm:text-base"
              >
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-[#7CD5C7]/35 px-2.5 py-0.5 text-[11px] font-extrabold text-[#464B71]">
                    {item.category}
                  </span>
                  <span>{item.q}</span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#118AB2] transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
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

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DDDCD4] bg-white p-5">
        <div>
          <p className="text-sm font-extrabold text-[#464B71]">
            Still have a clinical question for {selectedPublicBranch.shortName}?
          </p>
          <p className="text-xs text-[#464B71]/75">{selectedPublicBranch.address}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`tel:${selectedPublicBranch.contactNumber}`}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white"
          >
            <PhoneCall className="h-4 w-4" />
            <span>
              Call {selectedPublicBranch.displayPhone || selectedPublicBranch.contactNumber}
            </span>
          </a>
          <Link
            to="/contact"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F2F2ED] px-4 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
          >
            <span>All 7 Branches</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
