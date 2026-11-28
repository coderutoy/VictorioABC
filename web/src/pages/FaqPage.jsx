import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight } from 'lucide-react';

/**
 * Intentionally Empty FAQ Page (`/faq` — Phase 2.3.3):
 * - Keeps the FAQ list completely empty with zero fake or placeholder Q&A items
 *   while awaiting official client-supplied FAQ content.
 */
export function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="rounded-3xl bg-[#464B71] p-7 text-white shadow-md sm:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#7CD5C7]">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Patient Information</span>
        </span>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-white/85">
          Official answers and clinical guidance from Victorio Animal Bite Center.
        </p>
      </div>

      {/* Minimalist Empty-State Container (Zero Fake/Dummy Q&A Text) */}
      <section
        data-testid="empty-faq-container"
        className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DDDCD4] bg-white/95 p-8 text-center shadow-xs sm:p-12"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#118AB2]/10 text-[#118AB2]">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-[#464B71]">
          Clinic FAQs coming soon.
        </h2>
        <Link
          to="/branches"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#118AB2] hover:underline"
        >
          <span>Need immediate assistance? View our 7 clinic branches &amp; hotlines</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

export default FaqPage;
