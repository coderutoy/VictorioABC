export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 lg:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span>&copy; {new Date().getFullYear()} Victorio Animal Bite Center. All rights reserved.</span>
        <span>Clinical Decision Support &mdash; Physician verification required for all AI triage outputs.</span>
      </div>
    </footer>
  );
}
