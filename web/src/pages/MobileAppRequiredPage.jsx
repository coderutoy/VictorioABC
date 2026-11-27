import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  QrCode,
  CalendarClock,
  ShieldCheck,
  CheckCircle2,
  Home,
  LogOut,
  Apple,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOBILE_APP_DOWNLOAD_URL } from '../config/appLinks';
import { encodeQrMatrix } from '../utils/qrEncoder';
import { PagePetBackground } from '../components/PagePetBackground';

const MOBILE_APP_FEATURES = [
  {
    icon: QrCode,
    title: 'Vaccination Card & Digital QR Pass',
    detail: 'Your personal QR pass for fast check-in at any Victorio ABC branch.',
  },
  {
    icon: CalendarClock,
    title: 'PEP Dose Reminders & Appointment Tracking',
    detail: 'Day 0 / 3 / 7 / 14 / 28 schedule with reminders so you never miss a dose.',
  },
  {
    icon: ShieldCheck,
    title: 'AI Wound Pre-Triage',
    detail: 'Guided pre-triage and wound photo check, built exclusively for the mobile app.',
  },
];

function StoreBadge({ icon: Icon, small, name }) {
  return (
    <span
      aria-label={`${name} — coming soon`}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-1.5 text-left text-white"
    >
      <Icon className="h-5 w-5 shrink-0 text-[#7CD5C7]" />
      <span className="leading-tight">
        <span className="block text-[9px] font-semibold uppercase tracking-wide text-white/70">{small}</span>
        <span className="block text-xs font-extrabold">{name}</span>
      </span>
    </span>
  );
}

/**
 * Patient landing screen (`/mobile-app-only`). Patients are never given a web dashboard —
 * this page explains that records live exclusively in the mobile app and shows a SAMPLE QR.
 * Also served publicly at /app-download so the sample QR resolves to a real page.
 */
export function MobileAppRequiredPage() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  const qrMatrix = useMemo(() => encodeQrMatrix(MOBILE_APP_DOWNLOAD_URL), []);
  const qrSize = qrMatrix.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F2F2ED] px-4 py-6 text-[#464B71] sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center">
      <PagePetBackground />

      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-extrabold text-[#464B71] shadow-sm transition hover:bg-white hover:text-[#118AB2]"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
          {session && (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#464B71]/30 bg-white/90 px-3.5 py-2 text-xs font-extrabold text-[#464B71] shadow-sm transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-[#7CD5C7] bg-white/95 shadow-2xl lg:grid lg:grid-cols-12">
          <div className="space-y-5 p-6 sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3.5">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio Animal Bite Center Logo"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-[#118AB2] bg-white object-cover"
              />
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/35 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                  <Smartphone className="h-3.5 w-3.5 text-[#118AB2]" />
                  <span>Patient Account</span>
                </span>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-[#464B71] sm:text-3xl">
                  Get the Victorio ABC Mobile App
                </h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#464B71]/90">
              Patient features are built <strong>exclusively for the Victorio ABC Mobile App</strong>. The website sign-in is reserved for clinic staff, so there is no patient dashboard on the web.
            </p>

            <div className="space-y-2.5">
              {MOBILE_APP_FEATURES.map(({ icon: Icon, title, detail }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#118AB2] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-extrabold text-[#464B71] sm:text-sm">{title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#464B71]/80">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 bg-[#464B71] p-6 text-center text-white sm:p-8 lg:col-span-5">
            <div className="flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-[#7CD5C7] bg-white p-3 shadow-lg">
              <svg
                viewBox={`0 0 ${qrSize} ${qrSize}`}
                className="h-full w-full"
                shapeRendering="crispEdges"
                role="img"
                aria-label="Sample QR code for the Victorio ABC Mobile App download page"
              >
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#464B71" />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <p className="text-xs italic text-white/80">
              Sample QR — Official App Store &amp; Google Play link coming soon
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <StoreBadge icon={Apple} small="Coming soon on the" name="App Store" />
              <StoreBadge icon={Play} small="Coming soon on" name="Google Play" />
            </div>

            <ul className="w-full space-y-1.5 pt-1 text-left text-xs text-white/90">
              {['Install the Victorio ABC Mobile App', 'Sign in with your patient account', 'Show your QR pass at any of our 7 branches'].map(
                (step) => (
                  <li key={step} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                    <span>{step}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
