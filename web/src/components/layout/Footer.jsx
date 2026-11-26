export function Footer() {
  return (
    <footer className="border-t border-[#DDDCD4] bg-white px-4 py-3 text-xs text-[#464B71]/80 lg:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span>
          &copy; {new Date().getFullYear()} Victorio Animal Bite Center &mdash; San Jose del Monte, Bulacan.
        </span>
        <span>
          Clinical Decision Support &mdash; Physician verification required for all WHO Category &amp; PEP orders.
        </span>
      </div>
    </footer>
  );
}
