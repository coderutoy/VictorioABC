import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  QrCode,
  CalendarClock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { formatPhoneDisplay } from '../config/branches';
import { MOBILE_APP_DOWNLOAD_URL } from '../config/appLinks';
import { encodeQrMatrix } from '../utils/qrEncoder';
import { PagePetBackground } from '../components/PagePetBackground';

const MOBILE_APP_FEATURES = [
  {
    icon: QrCode,
    title: 'Digital QR Vaccination Pass',
    detail: 'Present your personal encrypted QR Pass at any of our 7 branches for instant check-in.',
  },
  {
    icon: CalendarClock,
    title: 'Day 0–28 PEP Schedule & Reminders',
    detail: 'Track your completed and upcoming Day 0, Day 3, Day 7, Day 14, and Day 28 doses in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'Mobile Pre-Triage & Bite Care Companion',
    detail: 'Access patient pre-triage tools and official digital vaccination completion certificates on your phone.',
  },
];

export function MobileAppRequiredPage() {
  const { signOut } = useAuth();
  const { selectedPublicBranch } = useBranch();

  const qrMatrix = useMemo(() => encodeQrMatrix(MOBILE_APP_DOWNLOAD_URL), []);
  const qrSize = qrMatrix.length;

  const formattedPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  // Ensure any web session is cleared so patient accounts cannot enter /dashboard/*
  useEffect(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="relative min-h-screen bg-[#F2F2ED] px-4 py-8 text-[#464B71] sm:px-6 sm:py-12 lg:flex lg:items-center lg:justify-center">
      {/* Subtle Dogs & Cats Background Pattern Behind Content */}
      <PagePetBackground />

      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-5">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-extrabold text-[#464B71] shadow-xs transition hover:bg-white hover:text-[#118AB2]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#464B71] px-3.5 py-1.5 text-xs font-extrabold text-[#7CD5C7]">
            <MapPin className="h-3.5 w-3.5" />
            <span>You are in: {selectedPublicBranch.shortName}</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-[#7CD5C7] bg-white/95 shadow-2xl backdrop-blur-xs lg:grid lg:grid-cols-12">
          {/* Left Info Column */}
          <div className="p-7 sm:p-9 lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3.5">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio Animal Bite Center Logo"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-[#118AB2] bg-white object-cover shadow-xs"
              />
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/35 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                  <Smartphone className="h-3.5 w-3.5 text-[#118AB2]" />
                  <span>Patient Account Detected</span>
                </span>
                <h1 className="mt-1 text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                  Download the Victorio ABC Mobile App
                </h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#464B71]/90">
              Patient vaccination cards, appointment reminders, Digital QR Passes, and pre-triage tools are available exclusively in the <strong>Victorio ABC Mobile App</strong>. The web sign-in is reserved for in-clinic medical staff.
            </p>

            <div className="space-y-3">
              {MOBILE_APP_FEATURES.map(({ icon: Icon, title, detail }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3.5"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#118AB2] text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-[#464B71] sm:text-sm">
                      {title}
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#464B71]/80">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>

              <a
                href={`tel:${selectedPublicBranch.contactNumber}`}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#464B71] bg-white px-5 py-2.5 text-xs font-extrabold text-[#464B71] transition hover:bg-[#F2F2ED]"
              >
                <PhoneCall className="h-4 w-4 text-[#118AB2]" />
                <span>
                  Call {selectedPublicBranch.shortName} ({formattedPhone})
                </span>
              </a>
            </div>
          </div>

          {/* Right QR & App Download Panel */}
          <div className="flex flex-col items-center justify-center bg-[#464B71] p-7 text-center text-white sm:p-9 lg:col-span-5 space-y-4">
            <span className="rounded-full bg-[#7CD5C7]/25 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              Android &amp; iOS Patient Companion
            </span>

            <div className="flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-[#7CD5C7] bg-white p-3 shadow-lg">
              <svg
                viewBox={`0 0 ${qrSize} ${qrSize}`}
                className="h-full w-full"
                shapeRendering="crispEdges"
                role="img"
                aria-label="QR Code to download the Victorio ABC Mobile App"
              >
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width="1"
                        height="1"
                        fill="#464B71"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-extrabold text-white">
                Scan With Your Phone Camera
              </p>
              <p className="text-xs leading-relaxed text-white/80">
                Sign in inside the mobile app with your registered email and password to view your Digital QR Pass and PEP schedule.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2 text-left text-xs text-white/90">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                <span>1. Install the Victorio ABC Mobile App</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                <span>2. Sign in with your Patient Account</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                <span>3. Show your QR Pass at any of our 7 branches</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
