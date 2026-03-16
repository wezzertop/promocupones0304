'use client'

import { useUIStore } from '@/lib/store'
import AdUnit from './AdUnit'
import { useEffect, useState, useRef } from 'react'

export default function AdSidebars() {
  const { isHeaderVisible } = useUIStore()
  const [windowWidth, setWindowWidth] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

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
        
        const adHalfHeight = 300
        const viewportCenter = window.innerHeight / 2
        const adBottomPos = viewportCenter + adHalfHeight
        const margin = 20 // Space between ad and footer
        
        // If footer comes up (footerRect.top decreases), we check if it hits the ad bottom
        // We want the ad bottom to be at most at (footerRect.top - margin)
        // If adBottomPos > (footerRect.top - margin), we need to shift up
        
        const limitY = footerRect.top - margin
        const overlap = adBottomPos - limitY
        
        setOffsetY(overlap > 0 ? overlap : 0)
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

  // Calculate center offset based on sidebar visibility
  // If sidebar is visible (width 256px), content is shifted right by 256px.
  // The visual center of content shifts by 128px to the right.
  const centerShift = isHeaderVisible ? 128 : 0
  
  // Base offset from center for ads (512px half-content + 32px margin = 544px)
  const baseOffset = 544

  // Required width calculation:
  // Without sidebar: 1024 (content) + 2*192 (ads+margin) ≈ 1408px -> 1400px limit
  // With sidebar: 256 (sidebar) + 1024 (content) + 2*192 (ads+margin) ≈ 1664px -> 1650px limit
  const minWidth = isHeaderVisible ? 1650 : 1400

  // Don't render on server (windowWidth 0) or if screen is too narrow
  if (windowWidth === 0 || windowWidth < minWidth) {
    return null
  }

  return (
    <>
      {/* Left Ad */}
      <div 
        className="fixed right-1/2 top-1/2 z-50 flex flex-col items-center justify-center transition-all duration-300"
        style={{ 
          marginRight: `${baseOffset - centerShift}px`,
          transform: `translate(0, calc(-50% - ${offsetY}px))` 
        }}
      >
        <AdUnit />
      </div>

      {/* Right Ad */}
      {/* Moved up slightly (top-[45%]) to avoid covering the floating button at bottom-right */}
      <div 
        className="fixed left-1/2 top-[45%] z-50 flex flex-col items-center justify-center transition-all duration-300"
        style={{ 
          marginLeft: `${baseOffset + centerShift}px`,
          transform: `translate(0, calc(-50% - ${offsetY}px))` 
        }}
      >
        <AdUnit />
      </div>
    </>
  )
}
