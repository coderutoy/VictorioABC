import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Compact, space-saving Public Health Warning Icon Trigger with floating popover.
 * - Desktop: Opens smoothly on hover or keyboard focus.
 * - Mobile / Touch: Toggles open on tap/click; closes on outside tap or Escape key.
 * - Edge Clamped & High Z-Index (z-50): Never clipped or pushed off-screen.
 */
export function TandokWarningPopover({ align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinnedByClick, setIsPinnedByClick] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleOutsidePointer(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsPinnedByClick(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsPinnedByClick(false);
      }
    }

    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('touchstart', handleOutsidePointer, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinnedByClick) {
      setIsOpen(false);
    }
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => {
      const next = !prev;
      setIsPinnedByClick(next);
      return next;
    });
  };

  const alignmentClass =
    align === 'right'
      ? 'right-0 sm:right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0 sm:left-0';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-flex items-center"
    >
      <button
        type="button"
        onClick={handleToggleClick}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          if (
            !isPinnedByClick &&
            containerRef.current &&
            !containerRef.current.contains(e.relatedTarget)
          ) {
            setIsOpen(false);
          }
        }}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label="Public Health Warning: Never Use Tandok, Garlic, or Vinegar"
        title="Public Health Warning: Never Use “Tandok”, Garlic, or Vinegar"
        className="group inline-flex min-h-[38px] items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-50 px-3 py-1 text-xs font-extrabold text-red-700 shadow-sm transition hover:border-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 transition-transform group-hover:scale-110" />
        <span>Tandok Warning</span>
      </button>

      {isOpen && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Public Health Warning: Never Use Tandok, Garlic, or Vinegar"
          className={`absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] sm:w-96 rounded-2xl border-2 border-red-300 bg-white p-4 text-left text-[#464B71] shadow-2xl ${alignmentClass}`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-red-700 sm:text-sm">
                Public Health Warning: Never Use &ldquo;Tandok&rdquo;, Garlic, or Vinegar
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setIsPinnedByClick(false);
              }}
              aria-label="Close warning"
              className="rounded-lg p-1 text-[#464B71]/60 hover:bg-[#F2F2ED] hover:text-[#464B71]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-[#464B71] sm:text-sm">
            Traditional horn suction (<em>tandok</em>) or rubbing garlic, vinegar, or herbs onto bite wounds{' '}
            <strong className="text-red-700">cannot remove or kill the rabies virus</strong>. It damages tissue, introduces tetanus spores, and causes dangerous delays in receiving life-saving Anti-Rabies Vaccine and ERIG.
          </p>
        </div>
      )}
    </div>
  );
}
