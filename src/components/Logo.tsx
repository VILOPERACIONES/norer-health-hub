interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  collapsed?: boolean;
}

const Logo = ({ size = 'md', className = '', collapsed = false }: LogoProps) => {
  const sizes = {
    sm: { title: 'text-lg', dot: 'w-1.5 h-1.5' },
    md: { title: 'text-3xl', dot: 'w-2 h-2' },
    lg: { title: 'text-5xl', dot: 'w-4 h-4' },
  };

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {/* N extraída del logo-nrdr.svg, centrada y en blanco */}
        <svg
          viewBox="0 0 72 43"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[28px] h-auto"
        >
          <path
            d="M53.32 25.83H52.14L32.32 0H0L7.74 7.79V42.2H25.75V16.34H26.85L46.69 42.2H71.33V0H53.32V25.83Z"
            fill="white"
          />
        </svg>
        <div className="flex flex-col items-center gap-1 opacity-20">
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">THINK</span>
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">EAT</span>
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">LIVE</span>
        </div>
      </div>
    );
  }

  return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="flex items-center gap-2 mb-1.5 pt-1">
          <img src="/logo-nrdr.svg" alt="NORDER" className="h-[22px] w-auto object-contain" />
        </div>
        <span className="text-[10px] font-black tracking-[0.45em] text-foreground/40 uppercase mt-1 text-center">
          THINK · EAT · LIVE
        </span>
      </div>
  );
};

export default Logo;
