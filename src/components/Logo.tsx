import Image from 'next/image';
import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function Logo({ 
  className = "", 
}: LogoProps) {
  return (
    <div className={`flex items-center justify-start overflow-hidden ${className}`}>
      <Image 
        src="https://i.imgur.com/p4ITR8W.png" 
        alt="CupOferta Logo Oficial"
        width={500}
        height={100}
        className="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-sm"
        priority
        unoptimized
      />
    </div>
  );
}
