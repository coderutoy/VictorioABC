import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Centered "Refresh page" pill rendered at the very bottom of public pages (beneath the footer),
 * so it appears naturally when the visitor scrolls to the bottom without colliding with fixed UI.
 */
export function BottomRefreshControl() {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    window.setTimeout(() => window.location.reload(), 450);
  };

  return (
    <div className="relative z-10 flex w-full justify-center px-4 py-5">
      <button
        type="button"
        onClick={handleRefresh}
        aria-label="Refresh page"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#464B71]/25 bg-white px-4 py-2 text-xs font-extrabold text-[#464B71] shadow-sm transition hover:border-[#118AB2] hover:text-[#118AB2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#118AB2]/40"
      >
        <RefreshCw
          className={`h-4 w-4 text-[#118AB2] ${spinning ? 'animate-spin' : ''}`}
        />
        <span>{spinning ? 'Refreshing…' : 'Refresh page'}</span>
      </button>
    </div>
  );
}
