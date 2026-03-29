'use client'

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-start overflow-hidden ${className}`}>
      {/* Light Mode Logo */}
      <Image 
        src="/logo-light.png"
        alt="CupOferta"
        width={1119}
        height={223}
        className="w-auto h-full object-contain block dark:hidden"
        priority
      />
      {/* Dark Mode Logo */}
      <Image 
        src="/logo-dark.png"
        alt="CupOferta"
        width={1119}
        height={223}
        className="w-auto h-full object-contain hidden dark:block"
        priority
      />
    </div>
  );
}
