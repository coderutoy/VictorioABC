import { Link } from 'react-router-dom';
import {
  Smartphone,
  Camera,
  QrCode,
  MapPin,
  Stamp,
  ShieldCheck,
  Bell,
  Building2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const PEP_TIMELINE_DAYS = [
  { day: 'D0', done: true },
  { day: 'D3', done: true },
  { day: 'D7', active: true },
  { day: 'D14', done: false },
  { day: 'D28', done: false },
];

const COMPANION_FAQ = [
  {
    q: 'Why does AI wound screening run on the mobile app instead of the website?',
    a: 'Smartphone cameras provide direct macro focus and flash calibration for wound images, while your encrypted digital intake QR pass stays securely on your device for instant scanning at any of our 7 clinics.',
  },
  {
    q: 'Is the AI preliminary category a final medical diagnosis?',
    a: 'No. The mobile app provides an instant preliminary WHO Category I, II, or III screening and 15-minute wound-washing timer. Upon arrival at Victorio ABC, an attending physician physically examines the wound, verifies or overrides the AI classification, and stamps their PRC License sign-off.',
  },
  {
    q: 'Can I take my Day 3, 7, 14, or 28 booster at a different Victorio ABC branch?',
    a: 'Yes. Your doctor-verified digital vaccination card and PEP schedule sync across all 7 official Bulacan and Caloocan clinics. Simply present your app QR pass at any branch triage desk.',
  },
  {
    q: 'Can I walk into a clinic even if I have not installed the mobile app yet?',
    a: 'Absolutely. All 7 Victorio ABC branches accept immediate walk-in bite patients daily. Our triage nurses will register you on-site right away.',
  },
];

export function MobileAppGuidePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* 1. VISUAL CLINICAL INFOGRAPHIC: "PATIENT MOBILE COMPANION GUIDE" */}
      <section
        data-testid="mobile-companion-infographic"
        className="overflow-hidden rounded-3xl border-2 border-[#464B71] bg-[#464B71] p-6 text-white shadow-xl sm:p-8 lg:p-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7] ring-1 ring-[#7CD5C7]/40">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile-Exclusive Clinical Companion</span>
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-4xl">
              Patient Mobile Companion Guide
            </h1>
            <p className="mt-1 text-xs text-white/85 sm:text-sm">
              From AI wound screening to cross-branch Day 0–28 PEP tracking in 4 connected steps.
            </p>
          </div>

          <Link
            to="/branches"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-xs font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
          >
            <Building2 className="h-4 w-4" />
            <span>Find Your Nearest Clinic Branch</span>
          </Link>
        </div>

        {/* Main Infographic Grid: 4 Connected Visual Nodes (Left 8 Cols) + Stylized Phone Screen Preview (Right 4 Cols) */}
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
          <div className="relative lg:col-span-8">
            <svg
              aria-hidden="true"
              viewBox="0 0 800 24"
              className="pointer-events-none hidden w-full text-[#7CD5C7]/50 md:block"
            >
              <line
                x1="60"
                y1="12"
                x2="740"
                y2="12"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="8 6"
              />
              <circle cx="100" cy="12" r="7" fill="#7CD5C7" />
              <circle cx="300" cy="12" r="7" fill="#7CD5C7" />
              <circle cx="500" cy="12" r="7" fill="#7CD5C7" />
              <circle cx="700" cy="12" r="7" fill="#7CD5C7" />
            </svg>

            <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* STEP 1: SNAP & SCREEN */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                      01
                    </span>
                    <span className="rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-extrabold text-red-200 ring-1 ring-red-400/40">
                      AI CAT I–III
                    </span>
                  </div>

                  <div className="mt-3 flex h-20 flex-col items-center justify-center rounded-xl border border-dashed border-[#7CD5C7]/40 bg-[#1E2238] p-2">
                    <Camera className="h-6 w-6 text-[#7CD5C7]" />
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-extrabold">
                        CAT I
                      </span>
                      <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold">
                        CAT II
                      </span>
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold">
                        CAT III
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-3 text-sm font-extrabold text-white">
                    1. Snap &amp; Screen
                  </h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/80">
                    Capture wound photo for instant AI Category I–III screening.
                  </p>
                </div>
              </div>

              {/* STEP 2: SCAN AT CLINIC */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                      02
                    </span>
                    <span className="rounded-full bg-[#118AB2]/35 px-2 py-0.5 text-[10px] font-extrabold text-[#7CD5C7]">
                      7 CLINICS
                    </span>
                  </div>

                  <div className="mt-3 flex h-20 items-center justify-center gap-3 rounded-xl border border-[#7CD5C7]/30 bg-[#1E2238] p-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 text-[#464B71]">
                      <QrCode className="h-9 w-9" />
                    </div>
                    <div className="text-left">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#7CD5C7]">
                        <MapPin className="h-3 w-3" />
                        <span>Nearest ABC</span>
                      </span>
                      <p className="text-[10px] font-bold text-white">
                        Zero-Paperwork Triage
                      </p>
                    </div>
                  </div>

                  <h2 className="mt-3 text-sm font-extrabold text-white">
                    2. Scan at Clinic
                  </h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/80">
                    Present your intake QR pass at any of our 7 official branches.
                  </p>
                </div>
              </div>

              {/* STEP 3: DOCTOR-VERIFIED CARD */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                      03
                    </span>
                    <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                      PRC STAMPED
                    </span>
                  </div>

                  <div className="mt-3 flex h-20 flex-col justify-center rounded-xl border border-emerald-400/40 bg-[#1E2238] px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#7CD5C7]">
                        DIGITAL PEP CARD
                      </span>
                      <Stamp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="mt-1 font-mono text-[10px] font-bold text-white">
                      MD PRC-0148291
                    </p>
                    <p className="text-[9px] text-emerald-300">
                      PhilHealth ABTP Validated
                    </p>
                  </div>

                  <h2 className="mt-3 text-sm font-extrabold text-white">
                    3. Doctor-Verified Card
                  </h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/80">
                    Physician confirms category &amp; stamps your digital bite card.
                  </p>
                </div>
              </div>

              {/* STEP 4: DAY 0-28 PEP TRACKER */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-[#7CD5C7]/35 bg-[#343857] p-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7CD5C7] font-mono text-xs font-extrabold text-[#464B71]">
                      04
                    </span>
                    <span className="rounded-full bg-[#7CD5C7]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#7CD5C7]">
                      AUTO ALERTS
                    </span>
                  </div>

                  <div className="mt-3 flex h-20 flex-col justify-center rounded-xl border border-[#7CD5C7]/30 bg-[#1E2238] px-2.5 py-2">
                    <div className="flex items-center justify-between">
                      {PEP_TIMELINE_DAYS.map((item) => (
                        <div key={item.day} className="flex flex-col items-center">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold ${
                              item.done
                                ? 'bg-emerald-500 text-white'
                                : item.active
                                  ? 'bg-[#7CD5C7] text-[#464B71] ring-2 ring-white'
                                  : 'bg-white/15 text-white/70'
                            }`}
                          >
                            {item.done ? '✓' : '•'}
                          </span>
                          <span className="mt-1 font-mono text-[9px] font-extrabold text-[#7CD5C7]">
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h2 className="mt-3 text-sm font-extrabold text-white">
                    4. Day 0–28 PEP Tracker
                  </h2>
                  <p className="mt-1 text-[11px] leading-snug text-white/80">
                    Automated booster alerts &amp; cross-branch dose continuity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Stylized Phone Screen Mockup Visual Callout */}
          <div className="flex justify-center lg:col-span-4">
            <div className="w-full max-w-[300px] rounded-[32px] border-4 border-[#7CD5C7] bg-[#1E2238] p-4 shadow-2xl">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />

              <div className="rounded-2xl bg-[#F2F2ED] p-3.5 text-[#464B71]">
                <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="/victorio_logo.jpg"
                      alt="Victorio App Icon"
                      className="h-7 w-7 rounded-full border border-[#118AB2] object-cover"
                    />
                    <div>
                      <p className="text-[11px] font-extrabold leading-tight">
                        Victorio ABC Pass
                      </p>
                      <p className="text-[9px] font-bold text-[#118AB2]">
                        PRC-Verified Digital Card
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                    CAT III
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-2xs">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#464B71] text-white">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 text-[10px]">
                    <p className="truncate font-mono font-extrabold text-[#118AB2]">
                      ABC-STM-2026-103
                    </p>
                    <p className="font-bold">Verorab PVRV (ID)</p>
                    <p className="text-[9px] opacity-75">Santa Maria Branch</p>
                  </div>
                </div>

                <div className="mt-2.5 rounded-xl bg-white p-2.5">
                  <div className="flex items-center justify-between text-[9px] font-extrabold uppercase">
                    <span>PEP Schedule</span>
                    <span className="text-emerald-600">Next: Day 7</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    {PEP_TIMELINE_DAYS.map((d) => (
                      <span
                        key={d.day}
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-extrabold ${
                          d.done
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.active
                              ? 'bg-[#118AB2] text-white'
                              : 'bg-[#F2F2ED] text-[#464B71]/60'
                        }`}
                      >
                        {d.day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW THE MOBILE APP CONNECTS TO YOUR IN-CLINIC VISIT */}
      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: 'Human-in-the-Loop Physician Verification',
            detail:
              'Every mobile AI wound submission is reviewed in person by an attending Victorio ABC physician who confirms the exposure category and calculates exact weight-based ERIG/HRIG dosing.',
          },
          {
            icon: Bell,
            title: 'Zero Missed Booster Doses',
            detail:
              'Completing Day 0, Day 3, Day 7, Day 14, and Day 28 on time is critical for 100% rabies protection. The app sends automated reminders before every scheduled booster.',
          },
          {
            icon: CheckCircle2,
            title: 'RA 10173 Encrypted Patient Privacy',
            detail:
              'All personal records are protected with AES-256-GCM encryption in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).',
          },
        ].map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3.5 text-base font-extrabold text-[#464B71]">{title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/80 sm:text-sm">
              {detail}
            </p>
          </div>
        ))}
      </section>

      {/* 3. PATIENT MOBILE APP FAQ */}
      <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDDCD4] pb-4">
          <div>
            <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase text-[#464B71]">
              Patient Guidance
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Frequently Asked Questions About the Mobile Companion App
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
          >
            <span>Explore Clinical Services</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {COMPANION_FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-5"
            >
              <h3 className="text-sm font-extrabold text-[#464B71]">{q}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#464B71]/85 sm:text-sm">
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MobileAppGuidePage;
