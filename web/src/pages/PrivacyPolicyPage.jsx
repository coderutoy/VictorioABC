import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Cookie,
  FileText,
  UserCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';
import { useBranch } from '../context/BranchContext';

const RA10173_RIGHTS = [
  {
    right: 'Right to Be Informed',
    detail:
      'You have the right to know what personal or clinical data is collected, how it is processed, and how cookies are used on our public website.',
  },
  {
    right: 'Right to Object & Withdraw Consent',
    detail:
      'You may review our cookie and data privacy disclosures at any time on this page or contact our Data Protection Officer.',
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
  const { isAccepted, consentRecord, acceptAll } = useCookieConsent();
  const { selectedPublicBranch } = useBranch();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
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
            {!isAccepted ? (
              <button
                type="button"
                data-testid="privacy-page-accept-cookies-btn"
                onClick={() => acceptAll()}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Accept All Cookies</span>
              </button>
            ) : (
              <span className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#7CD5C7]/25 px-5 py-2.5 text-xs font-extrabold text-[#7CD5C7] ring-1 ring-[#7CD5C7]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cookies Accepted</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inline Cookie Consent Prompt (automatically disposed once accepted) */}
      {!isAccepted ? (
        <div
          data-testid="privacy-inline-cookie-prompt"
          className="rounded-2xl border-2 border-[#7CD5C7] bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
                <Cookie className="h-4 w-4" />
                <span>Cookie Consent Notice</span>
              </div>
              <p className="text-base font-extrabold text-[#464B71]">
                Accept Cookies to Dismiss the Notice
              </p>
              <p className="text-xs text-[#464B71]/75">
                Clicking &ldquo;Accept All Cookies&rdquo; below saves your consent decision and immediately disposes the cookie banner across the entire website.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => acceptAll()}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0D6E8E]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Accept All Cookies</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#7CD5C7] bg-[#EAFBF8] p-4 text-xs font-bold text-[#464B71] flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Your cookie consent is active
              {consentRecord?.timestamp
                ? ` (recorded ${new Date(consentRecord.timestamp).toLocaleDateString('en-PH')})`
                : ''}
              .
            </span>
          </span>
        </div>
      )}

      {/* Clinic & DPO Details Card */}
      <div className="space-y-4 rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            Personal Information Controller (PIC) &amp; Data Protection Officer (DPO)
          </h2>
        </div>

        <div className="grid gap-4 text-xs sm:grid-cols-2 sm:text-sm">
          <div className="space-y-1.5 rounded-xl bg-[#F2F2ED]/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Healthcare Facility
            </p>
            <p className="font-extrabold text-[#464B71]">
              Victorio Animal Bite Center
            </p>
            <p className="text-xs text-[#464B71]/80">
              You are in: <strong>{selectedPublicBranch.shortName}</strong> ({selectedPublicBranch.address} • {selectedPublicBranch.displayPhone || selectedPublicBranch.contactNumber})
            </p>
            <p className="text-xs text-[#464B71]/80">
              <Link to="/contact" className="font-extrabold text-[#118AB2] underline">
                View All 7 Official Branches
              </Link>
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl bg-[#F2F2ED]/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
              Data Protection &amp; Compliance
            </p>
            <p className="font-extrabold text-[#464B71]">
              RA 10173 Healthcare Data Governance
            </p>
            <p className="text-xs text-[#464B71]/80">
              All clinical records are encrypted with AES-256-GCM and isolated per branch under PostgreSQL Row-Level Security (RLS).
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Information We Collect */}
      <div className="space-y-3 rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            1. Information We Collect (Public Website vs. Clinical EMR)
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-[#464B71]/90 sm:text-sm">
          In compliance with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong> and National Privacy Commission (NPC) guidelines for healthcare providers, we strictly separate public website browsing from confidential clinical medical records:
        </p>
        <div className="grid gap-4 pt-2 text-xs sm:grid-cols-2 sm:text-sm">
          <div className="space-y-1.5 rounded-xl border border-[#DDDCD4] p-4">
            <h3 className="font-extrabold text-[#464B71]">
              A. Public Website Browsing Data
            </h3>
            <p className="text-[#464B71]/80">
              Visitors can browse our first-aid infographics, WHO category guides, services, FAQs, and 7-branch directory anonymously. Your browser stores only your non-sensitive active branch selection (<code className="font-mono text-[11px]">victorio_abc_active_branch_slug</code>) and your cookie consent choice (<code className="font-mono text-[11px]">vabc_cookie_consent</code>).
            </p>
          </div>
          <div className="space-y-1.5 rounded-xl border border-[#DDDCD4] p-4">
            <h3 className="font-extrabold text-[#464B71]">
              B. Clinical &amp; Patient Medical Intake Data
            </h3>
            <p className="text-[#464B71]/80">
              Sensitive Personal Information (patient names, contact numbers, addresses, WHO Category I–III wound assessments, and PEP vaccination schedules) is processed <strong>exclusively</strong> within our authenticated clinical portal and encrypted database — <strong>never</strong> stored in browser cookies or <code className="font-mono text-[11px]">localStorage</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Data Security & Healthcare Confidentiality */}
      <div className="space-y-3 rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            2. Data Security &amp; Healthcare Confidentiality Safeguards
          </h2>
        </div>
        <ul className="space-y-2 text-xs text-[#464B71]/90 sm:text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#118AB2]" />
            <span>
              <strong>AES-256-GCM Field-Level Encryption:</strong> Patient names, contact numbers, and street addresses are encrypted with random 96-bit IVs and authentication tags before database storage.
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
              <strong>Role-Based Access &amp; Branch Isolation:</strong> Clinical records are restricted to authenticated physicians, nurses, and authorized administrators via Row-Level Security (RLS) and branch-locked authentication.
            </span>
          </li>
        </ul>
      </div>

      {/* Section 3: Data Subject Rights under RA 10173 */}
      <div className="space-y-4 rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <UserCheck className="h-5 w-5 text-[#118AB2]" />
          <h2 className="text-lg font-extrabold text-[#464B71]">
            3. Your Data Subject Rights Under RA 10173
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
