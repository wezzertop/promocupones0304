'use client'

import AdUnit from './AdUnit'
import { useEffect, useState } from 'react'

export default function AdSidebars() {
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
        const adHalfHeight = 300
        const viewportCenter = window.innerHeight / 2
        const adBottomPos = viewportCenter + adHalfHeight
        const margin = 20

        const limitY = footerRect.top - margin
        const overlap = adBottomPos - limitY
        
        setOffsetY(overlap > 0 ? overlap : 0)
      }
    }
    
    handleResize()
    handleScroll()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Sidebar is now always an overlay, so content always uses full width.
  // Right ad offset from center: half content (512px) + ad margin (32px) = 544px
  const baseOffset = 544

  // Only show when there's enough space for the right ad
  const minWidth = 1300

  if (windowWidth === 0 || windowWidth < minWidth) {
    return null
  }

  return (
    <>
      {/* Right Ad only — sidebar no longer affects content centering */}
      <div 
        className="fixed left-1/2 top-[45%] z-50 flex flex-col items-center justify-center transition-all duration-300"
        style={{ 
          marginLeft: `${baseOffset}px`,
          transform: `translate(0, calc(-50% - ${offsetY}px))` 
        }}
      >
        <AdUnit />
      </div>
    </>
  )
}
