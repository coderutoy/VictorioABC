import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  MapPin,
  Building2,
  Stethoscope,
  AlertCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { formatPhoneDisplay } from '../config/branches';

const TRUST_HIGHLIGHTS = [
  {
    icon: Stethoscope,
    title: 'DOH / WHO-Aligned Vaccination Tracking',
    detail: 'Day 0–28 PEP schedules, Category I–III clinical orders, and cold-chain FEFO logs.',
  },
  {
    icon: Lock,
    title: 'AES-256-GCM Encrypted Clinical Records',
    detail: 'Compliant with RA 10173 Data Privacy Act; zero patient PHI stored in browser cookies.',
  },
  {
    icon: Building2,
    title: '7 Bulacan & Caloocan Connected Branches',
    detail: 'Cross-branch Digital QR Pass continuity across Baliwag, Santa Maria, Pandi, DRT, Meycauayan & Caloocan.',
  },
];

export function LoginPage() {
  const { isAuthenticated, isSupabaseConfigured, signIn } = useAuth();
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    const rawTarget = location.state?.from?.pathname;
    const target = rawTarget && rawTarget !== '/' ? rawTarget : '/dashboard';
    return <Navigate to={target} replace />;
  }

  const validateFields = () => {
    const nextErrors = { email: '', password: '' };
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = 'Please enter your work or patient email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address (e.g., name@victorioabc.ph).';
    }
    if (!password) {
      nextErrors.password = 'Please enter your account password.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateFields()) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const rawTarget = location.state?.from?.pathname;
      const target = rawTarget && rawTarget !== '/' ? rawTarget : '/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setError(
        err?.message ||
          'Invalid email or password. Please check your credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formattedBranchPhone =
    selectedPublicBranch.displayPhone ||
    formatPhoneDisplay(selectedPublicBranch.contactNumber);

  return (
    <div className="min-h-screen bg-[#F2F2ED] px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Top Back to Home Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#464B71] transition hover:bg-white hover:text-[#118AB2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/privacy-policy"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#464B71]/80 hover:text-[#118AB2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <ShieldCheck className="h-4 w-4 text-[#118AB2]" />
            <span>RA 10173 Healthcare Privacy Policy</span>
          </Link>
        </div>

        {/* Mobile Compact Branded Header Banner (< lg) */}
        <div className="rounded-2xl bg-[#464B71] p-4 text-white shadow-md lg:hidden">
          <div className="flex items-center gap-3">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio Animal Bite Center Logo"
              className="h-12 w-12 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white">
                Victorio Animal Bite Center
              </p>
              <p className="text-xs font-semibold text-[#7CD5C7]">
                Patient &amp; Clinical Portal • {selectedPublicBranch.shortName}
              </p>
            </div>
          </div>
        </div>

        {/* Main 2-Column Split Clinical Container */}
        <div className="overflow-hidden rounded-3xl border border-[#DDDCD4] bg-white shadow-xl lg:grid lg:grid-cols-12">
          {/* Left Brand & Trust Panel (Desktop lg+) */}
          <div className="relative hidden overflow-hidden bg-[#464B71] p-8 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between xl:p-10">
            {/* Subtle Decorative Pet Pattern Silhouette at Low Opacity */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 opacity-15"
              style={{
                backgroundImage: "url('/backgrounds/pets-pattern-v1.svg')",
                backgroundSize: '260px 260px',
              }}
            />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="h-16 w-16 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white p-0.5 shadow-md">
                  <img
                    src="/victorio_logo.jpg"
                    alt="Victorio Animal Bite Center Logo"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-[#7CD5C7]/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7CD5C7]">
                    Multi-Branch EMR
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold leading-tight text-white">
                    Victorio Animal Bite Center
                  </h2>
                  <p className="text-xs font-semibold text-[#7CD5C7]">
                    Patient &amp; Clinical Portal
                  </p>
                </div>
              </div>

              {/* Active Branch Pill & Server Context */}
              <div className="rounded-2xl border border-white/15 bg-[#343857]/90 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7CD5C7]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Connected Branch Server</span>
                  </span>
                  <span className="rounded-full bg-[#118AB2] px-2 py-0.5 text-[10px] font-bold text-white">
                    {selectedPublicBranch.serverTenantId}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-white">
                  {selectedPublicBranch.shortName}
                </p>
                <p className="text-xs text-white/80">{selectedPublicBranch.address}</p>
                <p className="text-xs font-bold text-[#7CD5C7]">
                  Hotline: {formattedBranchPhone}
                </p>
              </div>

              {/* 3 Concise Trust Highlights */}
              <div className="space-y-3.5 pt-1">
                {TRUST_HIGHLIGHTS.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#7CD5C7]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white">{title}</h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/80">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 border-t border-white/15 pt-4 text-[11px] text-white/75">
              Protected under Republic Act No. 10173 (Data Privacy Act of 2012).
            </div>
          </div>

          {/* Right Authentication Card */}
          <div className="p-6 sm:p-8 lg:col-span-7 xl:p-10">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/30 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                <Lock className="h-3.5 w-3.5 text-[#118AB2]" />
                <span>Secure Healthcare Sign In</span>
              </span>
              <h1 className="text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                Sign In to Your Account
              </h1>
              <p className="text-xs text-[#464B71]/80 sm:text-sm">
                Access clinical triage, WHO Category I–III orders, and PEP vaccination records.
              </p>
            </div>

            {/* Active Branch Switcher Control */}
            <div className="mt-5 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/70 p-3.5">
              <label
                htmlFor="login-branch-select"
                className="flex items-center justify-between text-xs font-extrabold text-[#464B71]"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#118AB2]" />
                  <span>Active Clinic Branch</span>
                </span>
                <Link
                  to="/contact"
                  className="text-[11px] font-bold text-[#118AB2] hover:underline"
                >
                  All 7 Branches &rarr;
                </Link>
              </label>
              <select
                id="login-branch-select"
                value={selectedPublicBranch.slug}
                onChange={(e) => setSelectedBranchSlug(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#DDDCD4] bg-white px-3.5 py-2 text-xs font-extrabold text-[#464B71] focus:border-[#118AB2] focus:outline-none focus:ring-4 focus:ring-[#118AB2]/25"
              >
                {publicBranches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.shortName} — {b.displayPhone || formatPhoneDisplay(b.contactNumber)}
                  </option>
                ))}
              </select>
            </div>

            {!isSupabaseConfigured && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <span>
                  Configure <code className="font-semibold">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-semibold">VITE_SUPABASE_ANON_KEY</code> inside{' '}
                  <code className="font-semibold">web/.env</code> to enable authentication.
                </span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-4 flex items-start gap-2.5 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-800 sm:text-sm"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-extrabold text-[#464B71]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-[#464B71]/60" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="doctor.main@victorioabc.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    className={`min-h-[48px] w-full rounded-xl border bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-[#464B71] placeholder-[#464B71]/45 shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldErrors.email
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                        : 'border-[#DDDCD4] focus:border-[#118AB2] focus:ring-[#118AB2]/25'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p id="email-error" className="text-xs font-bold text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input with Show / Hide Toggle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-extrabold text-[#464B71]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-[#464B71]/60" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: '' });
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    className={`min-h-[48px] w-full rounded-xl border bg-white py-2.5 pl-11 pr-14 text-sm font-semibold text-[#464B71] placeholder-[#464B71]/45 shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldErrors.password
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                        : 'border-[#DDDCD4] focus:border-[#118AB2] focus:ring-[#118AB2]/25'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1.5 inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-[#464B71]/75 hover:bg-[#F2F2ED] hover:text-[#464B71] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#118AB2]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs font-bold text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-3 text-base font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Sign In to Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Support & Privacy Footer Hints */}
            <div className="mt-6 space-y-2.5 border-t border-[#F2F2ED] pt-4 text-xs text-[#464B71]/80">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                <span>
                  Need help accessing your patient record?{' '}
                  <Link
                    to="/contact"
                    className="font-extrabold text-[#118AB2] underline hover:text-[#0D6E8E]"
                  >
                    Contact your nearest Victorio branch
                  </Link>{' '}
                  ({selectedPublicBranch.shortName}: {formattedBranchPhone}).
                </span>
              </div>
              <p className="text-[11px] text-[#464B71]/70">
                By signing in, you acknowledge our{' '}
                <Link to="/privacy-policy" className="font-bold text-[#118AB2] underline">
                  RA 10173 Healthcare Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
