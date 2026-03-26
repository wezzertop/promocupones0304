import Image from 'next/image';
import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function Logo({ 
  className = "",
  iconClassName = "",
}: LogoProps) {
  return (
    <div className={`flex items-center justify-start overflow-hidden ${className}`}>
      <Image 
        src="https://i.imgur.com/GKs0cAA.png" 
        alt="CupOferta Logo Claro"
        width={500}
        height={100}
        className={`w-auto h-auto max-w-full max-h-full object-contain drop-shadow-sm hide-on-dark ${iconClassName}`}
        priority
        unoptimized
      />
      <Image 
        src="https://i.imgur.com/CV37Wnp.png" 
        alt="CupOferta Logo Oscuro"
        width={500}
        height={100}
        className={`w-auto h-auto max-w-full max-h-full object-contain drop-shadow-sm show-on-dark ${iconClassName}`}
        priority
        unoptimized
      />
    </div>
  );
}
