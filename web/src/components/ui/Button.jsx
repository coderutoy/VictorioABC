export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-[#118AB2] text-white hover:bg-[#0D6E8E] focus:ring-[#118AB2]',
    secondary:
      'bg-white text-[#464B71] border border-[#DDDCD4] hover:bg-[#F2F2ED] focus:ring-[#464B71]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-[#464B71] hover:bg-[#F2F2ED] focus:ring-[#464B71]',
  };

  const sizes = {
    sm: 'min-h-[38px] px-3 py-1.5 text-xs',
    md: 'min-h-[44px] px-4 py-2 text-sm',
    lg: 'min-h-[48px] px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
