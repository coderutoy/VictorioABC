export function Spinner({ size = 'md', label = 'Loading...' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-7 w-7 border-2',
    lg: 'h-10 w-10 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
      <div
        className={`animate-spin rounded-full border-slate-200 border-t-brand-600 ${sizes[size]}`}
        role="status"
        aria-label={label}
      />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
