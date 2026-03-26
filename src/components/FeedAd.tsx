'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import SmartAdUnit from './SmartAdUnit'

interface FeedAdProps {
  className?: string
  variant?: 'banner1' | 'banner2'
}

export default function FeedAd({ className, variant = 'banner1' }: FeedAdProps) {
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

  // Check if we are in sidebar context
  const isSidebar = className?.includes('w-full') && className?.includes('h-auto')

  // Mobile Config (320x50) - Used for Banner1-Mobile and all of Banner2
  const mobileConfig = {
    key: '2615cc9208c4d4e35c3f9a0e97ca3c1f',
    height: 50,
    width: 320,
    url: '//crateworkshop.com/2615cc9208c4d4e35c3f9a0e97ca3c1f/invoke.js'
  }

  // Desktop Config (468x60) - Used for Banner1-Desktop
  const desktopConfig = {
    key: 'f793fd7b10baae1fe357b24bc9a3c577',
    height: 60,
    width: 468,
    url: '//crateworkshop.com/f793fd7b10baae1fe357b24bc9a3c577/invoke.js'
  }

  // Leaderboard Config (728x90) - Used for Large Desktop
  const leaderboardConfig = {
    key: 'eddbdec3992923ef6b360d0495f574ed',
    height: 90,
    width: 728,
    url: '//crateworkshop.com/eddbdec3992923ef6b360d0495f574ed/invoke.js'
  }

  // Use mobile config if on mobile screen OR in a narrow sidebar
  let config = (isMobile || isSidebar) ? mobileConfig : desktopConfig

  // If on desktop and space allows (e.g. main feed top banner), try to use leaderboard
  if (!isMobile && !isSidebar && window.innerWidth >= 1024) {
     config = leaderboardConfig
  }

  const fallback = (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && "my-6", 
      isSidebar && "my-0",
      className
    )}>
      <div 
        className={cn(
          "flex flex-col items-center justify-center overflow-hidden transition-all duration-300 rounded-xl bg-gradient-to-r from-surface to-surface-hover border border-border relative group cursor-pointer hover:border-[#07B5A7]/50",
          config.width === 320 ? "w-full max-w-[320px]" : (config.width === 728 ? "w-full max-w-[728px]" : "w-full max-w-[468px]")
        )}
        style={{ height: `${config.height}px` }}
      >
         <div className="absolute inset-0 bg-[#07B5A7]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="relative z-10 flex items-center justify-between px-4 w-full h-full">
            <div className="flex flex-col items-start justify-center h-full">
              <span className="text-[10px] font-bold text-[#07B5A7] uppercase tracking-wider bg-[#07B5A7]/10 px-2 py-0.5 rounded-full mb-1">Publicidad</span>
              <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">Tu marca aquí</p>
            </div>
            <button className="text-xs bg-[#07B5A7] text-black font-bold px-3 py-1.5 rounded-lg hover:bg-[#25b84e] transition-colors whitespace-nowrap shadow-lg shadow-[#07B5A7]/20">
              Contáctanos
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
      isSidebar={isSidebar || false}
    />
  )
}
