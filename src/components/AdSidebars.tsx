'use client'

import { useUIStore } from '@/lib/store'
import AdUnit from './AdUnit'
import { useEffect, useState } from 'react'

export default function AdSidebars() {
  const { isHeaderVisible } = useUIStore()
  const [windowWidth, setWindowWidth] = useState(0)

  // Track window width to handle hydration mismatch and dynamic resizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    
    // Set initial
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Only show ads when header is hidden (user scrolled down or manually hid it)
  // We position ads relative to the centered content (max-w-5xl = 1024px)
  // Content half-width = 512px.
  // Ad width = 160px.
  // Margin = 8px (reduced to fit more screens).
  // Total offset from center = 512 + 8 = 520px.
  // Breakpoint required: (520 + 160) * 2 = 1360px.
  // We use 1350px as cutoff to be safe for 1366px screens.

  // Don't render on server or if header is visible or if screen is too narrow
  if (isHeaderVisible || windowWidth < 1350) {
    return null
  }

  return (
    <>
      {/* Left Ad */}
      <div className="fixed right-1/2 mr-[520px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center">
        <AdUnit />
      </div>

      {/* Right Ad */}
      <div className="fixed left-1/2 ml-[520px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center">
        <AdUnit />
      </div>
    </>
  )
}
