interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizes = {
    sm: { title: 'text-lg', dot: 'w-1.5 h-1.5' },
    md: { title: 'text-3xl', dot: 'w-2 h-2' },
    lg: { title: 'text-5xl', dot: 'w-4 h-4' },
  };

  return (
      <div className={`flex flex-col ${className}`}>
        <span className={`${sizes[size].title} font-black tracking-tighter text-foreground leading-none flex items-center gap-2`}>
          NORDER
          <span className={`${sizes[size].dot} bg-foreground rotate-45 group-hover:rotate-90 transition-transform duration-700`} />
        </span>
        <span className="text-[10px] font-black tracking-[0.6em] text-foreground/30 uppercase mt-1.5 ml-0.5">
          THINK · EAT · LIVE
        </span>
      </div>
  );
};

export default Logo;
