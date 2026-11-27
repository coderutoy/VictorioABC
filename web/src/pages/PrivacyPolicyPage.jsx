import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Cookie,
  FileText,
  UserCheck,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useCookieConsent,
  CONSENT_VALUES,
} from '../context/CookieConsentContext';
import { useBranch } from '../context/BranchContext';

const RA10173_RIGHTS = [
  {
    right: 'Right to Be Informed',
    detail:
      'You have the right to know what personal or clinical data is collected, how it is processed, and whether optional analytics cookies are active.',
  },
  {
    right: 'Right to Object & Withdraw Consent',
    detail:
      'You may decline non-essential cookies at any time by selecting "Essential Only" via the Cookie Preferences control.',
  },
  {
    right: 'Right to Access & Data Portability',
    detail:
      'Registered patients may request access to their PEP vaccination history and official clinical immunization certificates at any Victorio ABC branch.',
  },
  {
    right: 'Right to Rectification',
    detail:
      'You may request immediate correction of any inaccurate demographic or contact details in your patient profile.',
  },
  {
    right: 'Right to Erasure or Blocking',
    detail:
      'Subject to mandatory Department of Health (DOH) medical retention regulations, you may request blocking or removal of non-mandatory personal data.',
  },
];

export function PrivacyPolicyPage() {
  const { consent, openCookiePreferences, acceptAll, rejectNonEssential } =
    useCookieConsent();
  const { selectedPublicBranch } = useBranch();

  const currentConsentBadge =
    consent === CONSENT_VALUES.ACCEPTED
      ? 'Accepted All (Essential + Analytics)'
      : consent === CONSENT_VALUES.ESSENTIAL_ONLY
        ? 'Essential Only (Tracking Blocked)'
        : 'Unselected (Non-Essential Scripts Blocked by Default)';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <ShieldCheck className="h-4 w-4" />
              <span>Republic Act No. 10173 • Data Privacy Act of 2012</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Healthcare Privacy &amp; Cookie Policy
            </h1>
            <p className="text-sm text-white/85">
              How Victorio Animal Bite Center protects your browsing privacy and safeguards confidential clinical and rabies vaccination records across all 7 branches.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={openCookiePreferences}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-3 text-sm font-extrabold text-[#464B71] shadow-md transition hover:bg-[#68c7b8]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Manage Cookie Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Cookie Consent Status Bar */}
      <div className="rounded-2xl border-2 border-[#7CD5C7] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              <Cookie className="h-4 w-4" />
              <span>Your Active Cookie Preference</span>
            </div>
            <p className="text-base font-extrabold text-[#464B71]">
              {currentConsentBadge}
            </p>
            <p className="text-xs text-[#464B71]/75">
              You can change or withdraw your cookie consent at any time using the buttons here or in the website footer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={rejectNonEssential}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#464B71] bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <span>Use Essential Only</span>
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <span>Accept All Cookies</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinic & DPO Details Card */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            Personal Information Controller (PIC) &amp; Data Protection Officer (DPO)
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#F2F2ED]/70 p-4 space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Healthcare Facility / Legal Entity
            </p>
            <p className="font-extrabold text-[#464B71]">
              Victorio Animal Bite Center
            </p>
            <p className="text-xs text-[#464B71]/80">
              Registered Legal Entity: <code className="rounded bg-white px-1.5 py-0.5 font-semibold">[Official Registered Business / Legal Entity Name]</code>
            </p>
            <p className="text-xs text-[#464B71]/80">
              Active Branch Selected: <strong>{selectedPublicBranch.shortName}</strong> ({selectedPublicBranch.address} • {selectedPublicBranch.contactNumber})
            </p>
            <p className="text-xs text-[#464B71]/80">
              Official Clinic Hotline / Email:{' '}
              <code className="rounded bg-white px-1.5 py-0.5 font-semibold">[Official Clinic Email / Hotline Placeholder]</code>{' '}
              &bull;{' '}
              <Link to="/contact" className="font-extrabold text-[#118AB2] underline">
                View All 7 Official Branches
              </Link>
            </p>
          </div>

          <div className="rounded-xl bg-[#F2F2ED]/70 p-4 space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Data Protection Officer (DPO)
            </p>
            <p className="font-extrabold text-[#464B71]">
              DPO Name: <code className="rounded bg-white px-1.5 py-0.5">[Name of Data Protection Officer]</code>
            </p>
            <p className="text-xs text-[#464B71]/80">
              DPO Email:{' '}
              <code className="rounded bg-white px-1.5 py-0.5 font-semibold">
                [dpo@victorio-abc.ph — Replace with Official DPO Email]
              </code>
            </p>
            <p className="text-xs text-[#464B71]/80">
              DPO Contact &amp; Office Address:{' '}
              <code className="rounded bg-white px-1.5 py-0.5 font-semibold">
                [DPO Contact Number / Clinic Address]
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Information We Collect */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            1. Information We Collect (Public Website vs. Clinical EMR)
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-[#464B71]/90 sm:text-sm">
          In compliance with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong> and National Privacy Commission (NPC) guidelines for healthcare providers, we strictly separate public website browsing from confidential clinical medical records:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 pt-2 text-xs sm:text-sm">
          <div className="rounded-xl border border-[#DDDCD4] p-4 space-y-1.5">
            <h3 className="font-extrabold text-[#464B71]">
              A. Public Website Browsing Data
            </h3>
            <p className="text-[#464B71]/80">
              Visitors can browse our first-aid infographics, WHO category guides, services, FAQs, and 7-branch directory anonymously. Your browser stores only your non-sensitive active branch selection (<code className="font-mono text-[11px]">victorio_abc_active_branch_slug</code>) and your cookie consent choice (<code className="font-mono text-[11px]">vabc_cookie_consent</code>).
            </p>
          </div>
          <div className="rounded-xl border border-[#DDDCD4] p-4 space-y-1.5">
            <h3 className="font-extrabold text-[#464B71]">
              B. Clinical &amp; Patient Medical Intake Data
            </h3>
            <p className="text-[#464B71]/80">
              Sensitive Personal Information (patient names, birthdates, contact numbers, addresses, government/PhilHealth IDs, WHO Category I–III wound assessments, and PEP vaccination schedules) is processed <strong>exclusively</strong> within our authenticated clinical portal and encrypted database — <strong>never</strong> stored in browser cookies or <code className="font-mono text-[11px]">localStorage</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: How We Use Cookies & Tracking */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Cookie className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            2. How We Use Cookies &amp; Conditional Script Blocking
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 pt-1 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#EAFBF8] border border-[#7CD5C7] p-4 space-y-1.5">
            <span className="rounded-full bg-[#464B71] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#7CD5C7]">
              Always Active
            </span>
            <h3 className="font-extrabold text-[#464B71] pt-1">
              Essential Cookies &amp; UI Preferences
            </h3>
            <p className="text-[#464B71]/85">
              Required for core website operation, security, remembering your cookie consent decision (<code className="font-mono text-[11px]">vabc_consent</code>), and keeping your selected Victorio ABC branch active across pages. These contain zero personal or medical data.
            </p>
          </div>

          <div className="rounded-xl bg-[#F2F2ED] border border-[#DDDCD4] p-4 space-y-1.5">
            <span className="rounded-full bg-[#118AB2] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
              Opt-In Only (Blocked by Default)
            </span>
            <h3 className="font-extrabold text-[#464B71] pt-1">
              Non-Essential Analytics &amp; Marketing Scripts
            </h3>
            <p className="text-[#464B71]/85">
              Optional analytics or traffic-measurement scripts are <strong>strictly blocked by default</strong> on initial visit and whenever you choose <strong>&ldquo;Essential Only&rdquo;</strong>. They are dynamically loaded only if you explicitly click <strong>&ldquo;Accept All&rdquo;</strong>, and are immediately unloaded and cleared if you switch back to <strong>&ldquo;Essential Only&rdquo;</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Data Security & Healthcare Confidentiality */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            3. Data Security &amp; Healthcare Confidentiality Safeguards
          </h2>
        </div>
        <ul className="space-y-2 text-xs text-[#464B71]/90 sm:text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
            <span>
              <strong>AES-256-GCM Field-Level Encryption:</strong> Patient contact numbers, street addresses, and government IDs are encrypted with random 96-bit IVs and authentication tags before database storage.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
            <span>
              <strong>Zero PHI in Client Cookies or LocalStorage:</strong> Our automated privacy sanitizer blocks and purges any attempt to store patient records, bite categories, or clinical orders in browser storage.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
            <span>
              <strong>Role-Based Access &amp; Secure Session Flags:</strong> Clinical records are restricted to authenticated physicians, nurses, and authorized administrators via Row-Level Security (RLS) and strict <code className="font-mono text-[11px]">HttpOnly</code>, <code className="font-mono text-[11px]">Secure</code>, and <code className="font-mono text-[11px]">SameSite=Lax</code> cookie enforcement.
            </span>
          </li>
        </ul>
      </div>

      {/* Section 4: Data Subject Rights under RA 10173 */}
      <div className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <UserCheck className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            4. Your Data Subject Rights Under RA 10173
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {RA10173_RIGHTS.map((item) => (
            <div
              key={item.right}
              className="rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 p-4"
            >
              <h3 className="text-sm font-extrabold text-[#464B71]">{item.right}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#464B71]/80">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
