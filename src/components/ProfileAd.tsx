'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import SmartAdUnit from './SmartAdUnit'

interface ProfileAdProps {
  className?: string
  variant?: 'sidebar' | 'feed'
}

export default function ProfileAd({ className, variant = 'sidebar' }: ProfileAdProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMounted) return null

  // Configuration for Desktop Sidebar (300x250)
  // User did not provide a 300x250 ad, so we use the 320x50 (mobile) ad which fits in the 320px sidebar
  const desktopSidebarConfig = {
    key: '2615cc9208c4d4e35c3f9a0e97ca3c1f',
    height: 50,
    width: 320,
    url: '//crateworkshop.com/2615cc9208c4d4e35c3f9a0e97ca3c1f/invoke.js'
  }

  // Configuration for Desktop Feed (468x60)
  const desktopFeedConfig = {
    key: 'f793fd7b10baae1fe357b24bc9a3c577',
    height: 60,
    width: 468,
    url: '//crateworkshop.com/f793fd7b10baae1fe357b24bc9a3c577/invoke.js'
  }

  // Configuration for Mobile (320x50) - Used for both
  const mobileConfig = {
    key: '2615cc9208c4d4e35c3f9a0e97ca3c1f',
    height: 50,
    width: 320,
    url: '//crateworkshop.com/2615cc9208c4d4e35c3f9a0e97ca3c1f/invoke.js'
  }

  // Determine which config to use
  let config = mobileConfig

  if (!isMobile) {
    if (variant === 'sidebar') {
      config = desktopSidebarConfig
    } else {
      config = desktopFeedConfig
    }
  }

  const fallback = (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && "my-4", 
      className
    )}>
      <div 
        className={cn(
          "flex flex-col items-center justify-center overflow-hidden transition-all duration-300 rounded-xl bg-gradient-to-r from-surface to-surface-hover border border-border relative group cursor-pointer hover:border-[#07B5A7]/50",
          config.width === 300 ? "w-[300px]" : (config.width === 320 ? "w-full max-w-[320px]" : "w-full max-w-[468px]")
        )}
        style={{ height: `${config.height}px` }}
      >
         <div className="absolute inset-0 bg-[#07B5A7]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="relative z-10 flex items-center justify-center gap-4 w-full h-full px-4">
            <span className="text-[10px] font-bold text-[#07B5A7] uppercase tracking-wider bg-[#07B5A7]/10 px-2 py-0.5 rounded-full">Publicidad</span>
            <p className="text-xs text-gray-400 font-medium truncate max-w-[150px]">Tu marca aquí</p>
            <button className="text-xs bg-[#07B5A7] text-black font-bold px-3 py-1.5 rounded-lg hover:bg-[#25b84e] transition-colors whitespace-nowrap shadow-lg shadow-[#07B5A7]/20">
              Ver más
            </button>
         </div>
      </div>
    </div>
  )

  return (
    <SmartAdUnit 
      config={config} 
      className={className}
      fallback={fallback}
      variant={variant}
      isMobile={isMobile}
    />
  )
}
