import { useState } from 'react';
import { Eye, Sparkles, Type, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export function AccessibilityToolbar() {
  const {
    fontScale,
    highContrast,
    reduceMotion,
    setFontScale,
    toggleHighContrast,
    toggleReduceMotion,
    resetAccessibility,
  } = useAccessibility();

  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Accessibility display options"
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/20"
      >
        <Eye className="h-3.5 w-3.5 text-[#7CD5C7]" />
        <span>A11y</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#DDDCD4] bg-white p-4 text-[#464B71] shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#464B71]">
              PWD &amp; Elderly Accessibility
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-[#464B71]/70 hover:bg-[#F2F2ED]"
              aria-label="Close accessibility menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#464B71]">
              <Type className="h-3.5 w-3.5 text-[#118AB2]" />
              <span>Text Size</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[100, 115, 130].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setFontScale(scale)}
                  className={`min-h-[40px] rounded-xl text-xs font-extrabold transition ${
                    fontScale === scale
                      ? 'bg-[#118AB2] text-white'
                      : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
                  }`}
                >
                  {scale}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                highContrast
                  ? 'border-[#464B71] bg-[#464B71] text-white'
                  : 'border-[#DDDCD4] bg-[#F2F2ED]/60 text-[#464B71]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>High Contrast (Lowers Bg Pattern)</span>
              </span>
              <span>{highContrast ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={toggleReduceMotion}
              className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                reduceMotion
                  ? 'border-[#464B71] bg-[#464B71] text-white'
                  : 'border-[#DDDCD4] bg-[#F2F2ED]/60 text-[#464B71]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Reduce Motion</span>
              </span>
              <span>{reduceMotion ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={resetAccessibility}
            className="w-full text-center text-[11px] font-bold text-[#118AB2] hover:underline pt-1"
          >
            Reset Display Defaults
          </button>
        </div>
      )}
    </div>
  );
}
