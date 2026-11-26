export function Badge({ children, tone = 'slate', className = '' }) {
  const tones = {
    slate: 'bg-[#F2F2ED] text-[#464B71] ring-[#DDDCD4]',
    teal: 'bg-[#7CD5C7]/30 text-[#464B71] ring-[#7CD5C7]',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-[#E6F5FA] text-[#118AB2] ring-[#118AB2]/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone] || tones.slate} ${className}`}
    >
      {children}
    </span>
  );
}
