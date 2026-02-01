
import React from 'react';

interface NanaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const NanaLogo: React.FC<NanaLogoProps> = ({ className = "", size = 'md', showText = true }) => {
  const textSizes = {
    sm: "text-2xl",
    md: "text-4xl md:text-5xl",
    lg: "text-5xl sm:text-7xl md:text-8xl" 
  };

  const subTextSizes = {
    sm: "text-xs",
    md: "text-lg md:text-xl",
    lg: "text-2xl sm:text-3xl md:text-4xl"
  };

  if (!showText) return null;

  return (
    <div className={`flex flex-col items-start -space-y-1 ${className}`}>
      <h1 className={`${textSizes[size]} font-black uppercase tracking-tighter leading-none text-black drop-shadow-[2px_2px_0px_#FFD700] md:drop-shadow-[4px_4px_0px_#FFD700]`}>
        Guitnana
      </h1>
      <h2 className={`${subTextSizes[size]} font-black uppercase tracking-[0.2em] text-[#FF1493] italic drop-shadow-[1px_1px_0px_#000] md:drop-shadow-[2px_2px_0px_#000]`}>
        Songbook
      </h2>
    </div>
  );
};
