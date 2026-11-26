export function Spinner({ size = 'md', label = 'Loading...' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-7 w-7 border-2',
    lg: 'h-10 w-10 border-4',
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center justify-center gap-2 text-[#464B71]">
        <div
          className={`animate-spin rounded-full border-[#DDDCD4] border-t-[#118AB2] ${sizes[size]}`}
          role="status"
          aria-label={label}
        />
        {label && <span className="text-xs font-semibold text-[#464B71]/80">{label}</span>}
      </div>
      <div className="mx-auto max-w-2xl space-y-2.5 animate-pulse">
        <div className="h-9 rounded-lg bg-[#F2F2ED]" />
        <div className="h-9 rounded-lg bg-[#F2F2ED]/80" />
        <div className="h-9 rounded-lg bg-[#F2F2ED]/60" />
      </div>
    </div>
  );
}
