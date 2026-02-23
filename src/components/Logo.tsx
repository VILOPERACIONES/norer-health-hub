interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizes = {
    sm: { title: 'text-xl', sub: 'text-[8px] tracking-[0.25em]' },
    md: { title: 'text-2xl', sub: 'text-[9px] tracking-[0.3em]' },
    lg: { title: 'text-4xl', sub: 'text-[11px] tracking-[0.35em]' },
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className={`${sizes[size].title} font-extrabold tracking-wider text-foreground`}>
        NORER
      </span>
      <span className={`${sizes[size].sub} text-muted-foreground font-medium uppercase`}>
        Think · Eat · Live
      </span>
    </div>
  );
};

export default Logo;
