'use client'

import React from 'react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use dark colors by default (since defaultTheme is "dark")
  // Only switch to light after mounting when we know the actual theme
  const isDark = !mounted || resolvedTheme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#111111';

  return (
    <div className={`flex items-center justify-start overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 260 48"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-full object-contain"
        aria-label="CupOferta"
      >
        <text x="0" y="36" fontSize="34" fontFamily="system-ui, sans-serif">🚀</text>
        <text x="42" y="36" fontSize="28" fontWeight="900" fontFamily="system-ui, sans-serif" fill={textColor}>CUP</text>
        <text x="112" y="36" fontSize="28" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#07B5A7">OFERTA</text>
      </svg>
    </div>
  );
}
