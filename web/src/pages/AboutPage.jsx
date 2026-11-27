import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  Building2,
  Stethoscope,
  Lock,
  ArrowRight,
  MapPin,
  PhoneCall,
} from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const PILLARS = [
  {
    title: 'DOH & WHO-Aligned Clinical Governance',
    icon: Stethoscope,
    description:
      'Every bite and scratch exposure is categorized using World Health Organization (WHO) Category I, II, and III guidelines, ensuring timely Anti-Rabies Vaccination (PVRV/PCECV) and life-saving ERIG/HRIG wound infiltration.',
  },
  {
    title: '7-Branch Connected Care Network',
    icon: Building2,
    description:
      'Patients registered at any of our 7 branches in Baliwag, Santa Maria, Pandi, Doña Remedios Trinidad (DRT), Meycauayan (Camalig & Poblacion), and Cefels Caloocan can seamlessly receive follow-up Day 3, 7, 14, or 28 doses at any location.',
  },
  {
    title: 'Digital QR Pass & Dose Compliance Tracking',
    icon: QrCode,
    description:
      'Upon Day 0 intake, each patient receives a unique Digital QR Pass linked to their automated PEP schedule so nurses can check them in instantly and prevent missed or delayed vaccine doses.',
  },
  {
    title: 'AES-256-GCM Encrypted Patient Privacy',
    icon: Lock,
    description:
      'Sensitive patient contact numbers, street addresses, and government IDs are encrypted with AES-256-GCM before storage, backed by role-based access control and immutable clinical audit logs.',
  },
];

export function AboutPage() {
  const { publicBranches, selectedPublicBranch, setSelectedBranchSlug } = useBranch();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Hero Card */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7CD5C7]">
              <ShieldCheck className="h-4 w-4" />
              <span>About Victorio Animal Bite Center</span>
            </span>
            <h1 className="text-2xl font-extrabold sm:text-4xl">
              Accessible, Multi-Branch Rabies Prevention Across Bulacan &amp; Metro Manila
            </h1>
            <p className="text-sm leading-relaxed text-white/85 sm:text-base">
              Victorio Animal Bite Center was established to provide fast, affordable, and physician-supervised rabies Post-Exposure Prophylaxis (PEP) with modern digital continuity across our 7 official outpatient clinics.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
            <Link
              to="/services"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-5 py-2.5 text-sm font-extrabold text-[#464B71]"
            >
              <span>Explore Clinical Services</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white"
            >
              <span>View All 7 Branches</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Clinical & Digital Pillars */}
      <div className="grid gap-5 md:grid-cols-2">
        {PILLARS.map(({ title, icon: Icon, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-[#DDDCD4] bg-white p-6 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#118AB2]/10 text-[#118AB2]">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[#464B71]">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#464B71]/80 sm:text-sm">
              {description}
            </p>
          </div>
        ))}
      </div>

      {/* 7-Branch Network Overview */}
      <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-[#7CD5C7]/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              Multi-Tenant Clinic Network
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71] sm:text-2xl">
              Our 7 Official Victorio ABC Branches
            </h2>
          </div>
          <p className="text-xs font-semibold text-[#464B71]/75">
            Click any branch to set it as your active clinic context.
          </p>
        </div>

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {publicBranches.map((branch) => {
            const isSelected = branch.slug === selectedPublicBranch.slug;
            return (
              <button
                key={branch.slug}
                type="button"
                onClick={() => setSelectedBranchSlug(branch.slug)}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-[#118AB2] bg-[#7CD5C7]/20 ring-2 ring-[#118AB2]'
                    : 'border-[#DDDCD4] bg-[#F2F2ED]/50 hover:bg-[#F2F2ED]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#464B71]">
                      {branch.shortName}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-[#118AB2] px-2 py-0.5 text-[10px] font-bold text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[#464B71]/80">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#118AB2]" />
                    <span>{branch.address}</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#118AB2]">
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>{branch.displayPhone || branch.contactNumber}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
