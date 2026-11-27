import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Building2,
  Stethoscope,
  AlertCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useAuth, ROLES, getRoleHome } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { formatBranchLabel } from '../config/branches';
import { supabaseConfigWarning } from '../lib/supabase';
import { PagePetBackground } from '../components/PagePetBackground';

const TRUST_HIGHLIGHTS = [
  {
    icon: Stethoscope,
    title: 'DOH / WHO-Aligned Clinical Workflow',
    detail: 'Day 0–28 PEP schedules, Category I–III clinical orders, and cold-chain FEFO logs.',
  },
  {
    icon: Lock,
    title: 'AES-256-GCM Encrypted Records',
    detail: 'Compliant with RA 10173 Data Privacy Act; zero PHI stored in browser cookies.',
  },
  {
    icon: Building2,
    title: '7 Bulacan & Caloocan Connected Branches',
    detail: 'Cross-branch Digital QR Pass continuity across Baliwag, Santa Maria, Pandi, DRT, Meycauayan & Caloocan.',
  },
];

export function LoginPage() {
  const { isAuthenticated, role, isSupabaseConfigured, signIn } = useAuth();
  const { selectedPublicBranch } = useBranch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  const branchSubtext =
    selectedPublicBranch?.branchLabel || formatBranchLabel(selectedPublicBranch);

  const validateFields = () => {
    const nextErrors = { email: '', password: '' };
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = 'Please enter your email address.';
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
      const result = await signIn(email.trim(), password, selectedPublicBranch);
      if (result?.requireMobileApp || result?.role === ROLES.PATIENT) {
        navigate(getRoleHome(ROLES.PATIENT), { replace: true });
        return;
      }
      navigate(getRoleHome(result?.role), { replace: true });
    } catch (err) {
      setError(
        err?.message ||
          'Invalid email or password. Please check your credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F2F2ED] px-4 py-6 text-[#464B71] sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center">
      {/* Subtle Dogs & Cats Background Design Behind the Login Layout */}
      <PagePetBackground />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-4">
        {/* Top Back to Home Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/85 px-3.5 py-1.5 text-xs font-extrabold text-[#464B71] shadow-xs transition hover:bg-white hover:text-[#118AB2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/privacy-policy"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white/85 px-3.5 py-1.5 text-xs font-bold text-[#464B71]/90 shadow-xs hover:bg-white hover:text-[#118AB2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]"
          >
            <ShieldCheck className="h-4 w-4 text-[#118AB2]" />
            <span>RA 10173 Healthcare Privacy Policy</span>
          </Link>
        </div>

        {/* Mobile Compact Branded Header (< lg): Logo + Subtle Branch Plain Text Underneath */}
        <div className="rounded-2xl bg-[#464B71] p-4 text-white shadow-md lg:hidden">
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-3">
              <img
                src="/victorio_logo.jpg"
                alt="Victorio Animal Bite Center Logo"
                className="h-12 w-12 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">
                  Victorio Animal Bite Center
                </p>
                <p className="text-xs font-medium text-white/75">{branchSubtext}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Split Container */}
        <div className="overflow-hidden rounded-3xl border border-[#DDDCD4] bg-white/95 shadow-xl backdrop-blur-xs lg:grid lg:grid-cols-12">
          {/* Left Brand & Trust Panel (Desktop lg+) */}
          <div className="relative hidden overflow-hidden bg-[#464B71] p-8 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between xl:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 opacity-15"
              style={{
                backgroundImage: "url('/backgrounds/pets-pattern-v1.svg')",
                backgroundSize: '260px 260px',
              }}
            />

            <div className="relative z-10 space-y-6">
              {/* Victorio ABC Logo with ONLY the current branch name in clean, subtle plain text underneath */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3.5">
                  <div className="h-16 w-16 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white p-0.5 shadow-md">
                    <img
                      src="/victorio_logo.jpg"
                      alt="Victorio Animal Bite Center Logo"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold leading-tight text-white">
                      Victorio Animal Bite Center
                    </h2>
                    <p
                      data-testid="login-branch-subtext"
                      className="mt-0.5 text-xs font-medium text-white/75"
                    >
                      {branchSubtext}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Concise Trust Highlights */}
              <div className="space-y-3.5 pt-2">
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

          {/* Right Authentication Card (No branch banners/badges/pills or location callouts) */}
          <div className="p-6 sm:p-8 lg:col-span-7 xl:p-10">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[#464B71] sm:text-3xl">
                Sign In
              </h1>
              <p className="text-xs text-[#464B71]/75 sm:text-sm">
                Enter your account credentials to continue.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <span>{supabaseConfigWarning}</span>
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
                    placeholder="name@victorioabc.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    className={`min-h-[48px] w-full rounded-xl border bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-[#464B71] placeholder-[#464B71]/45 shadow-xs transition focus:outline-none focus:ring-4 ${
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
                    className={`min-h-[48px] w-full rounded-xl border bg-white py-2.5 pl-11 pr-14 text-sm font-semibold text-[#464B71] placeholder-[#464B71]/45 shadow-xs transition focus:outline-none focus:ring-4 ${
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
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Support & Privacy Footer Hints */}
            <div className="mt-6 space-y-2.5 border-t border-[#F2F2ED] pt-4 text-xs text-[#464B71]/80">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
                <span>
                  Need assistance?{' '}
                  <Link
                    to="/contact"
                    className="font-extrabold text-[#118AB2] underline hover:text-[#0D6E8E]"
                  >
                    View clinic contact directory
                  </Link>
                  .
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
