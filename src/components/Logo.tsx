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
        <span className="text-4xl font-black tracking-tighter text-foreground leading-none">N</span>
        <div className="flex flex-col items-center gap-1 opacity-20">
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">THINK</span>
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">EAT</span>
          <span className="text-[6px] font-black tracking-widest uppercase leading-none">LIVE</span>
        </div>
      </div>
    );
  }

  return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-2 mb-1.5 pt-1">
          <img src="/logo-nrdr.png" alt="NORDER" className="h-[22px] w-auto object-contain" />
        </div>
        <span className="text-[10px] font-black tracking-[0.45em] text-foreground/40 uppercase mt-1">
          THINK · EAT · LIVE
        </span>
      </div>
  );
};

export default Logo;
