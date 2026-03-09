'use client'

import { useUIStore } from '@/lib/store'
import AdUnit from './AdUnit'
import { useEffect, useState, useRef } from 'react'

export default function AdSidebars() {
  const { isHeaderVisible } = useUIStore()
  const [windowWidth, setWindowWidth] = useState(0)
  const [reachedFooter, setReachedFooter] = useState(false)

  // Track window width and scroll position
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    
    const handleScroll = () => {
      // Check if we reached the footer
      const footer = document.querySelector('footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        // Ad is centered in viewport. 
        // Ad height is 600px.
        // Ad bottom edge relative to viewport top is (window.innerHeight / 2) + 300.
        // We want to hide the ad when the footer top gets close to this position.
        
        // We add a generous buffer to make sure it disappears well before overlap
        const adBottomPos = (window.innerHeight / 2) + 300
        const buffer = 150 
        
        // footerRect.top is the distance from viewport top to footer top.
        // If footerTop < adBottomPos, they are overlapping.
        setReachedFooter(footerRect.top < (adBottomPos + buffer))
      }
    }
    
    // Set initial
    handleResize()
    handleScroll()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Only show ads when header is hidden (user scrolled down or manually hid it)
  // We position ads relative to the centered content (max-w-5xl = 1024px)
  // Content half-width = 512px.
  // Ad width = 160px.
  // Margin = 32px (increased to avoid being "pegado").
  // Total offset from center = 512 + 32 = 544px.
  // Breakpoint required: (544 + 160) * 2 = 1408px.
  // We use 1400px as cutoff.

  // Don't render on server or if header is visible or if screen is too narrow
  // Also hide if we reached the footer
  if (isHeaderVisible || windowWidth < 1400 || reachedFooter) {
    return null
  }

  return (
    <>
      {/* Left Ad */}
      <div className="fixed right-1/2 mr-[544px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center transition-opacity duration-300">
        <AdUnit />
      </div>

      {/* Right Ad */}
      {/* Moved up slightly (top-[45%]) to avoid covering the floating button at bottom-right */}
      <div className="fixed left-1/2 ml-[544px] top-[45%] -translate-y-1/2 z-50 flex flex-col items-center justify-center transition-opacity duration-300">
        <AdUnit />
      </div>
    </>
  )
}
