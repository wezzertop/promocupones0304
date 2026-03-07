import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/lib/store'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const { setHeaderVisible, isHeaderVisible } = useUIStore()
  
  // Use ref to persist last scroll position without re-triggering effect
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Initialize with current scroll
    lastScrollY.current = window.scrollY

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY.current ? 'down' : 'up'
      
      // Calculate difference from last UPDATE point
      const diff = Math.abs(scrollY - lastScrollY.current)

      // Always show header at the very top (expanded safe zone)
      if (scrollY < 50) {
        setHeaderVisible(true)
        setScrollDirection('up')
        lastScrollY.current = scrollY > 0 ? scrollY : 0
        return
      }

      // Logic for hiding/showing based on direction and threshold
      if (direction === 'down') {
        // Need to scroll down more significantly to hide header (avoid accidental hiding)
        if (diff > 20) {
          if (scrollDirection !== 'down') {
            setScrollDirection('down')
            setHeaderVisible(false)
          }
          lastScrollY.current = scrollY
        }
      } else if (direction === 'up') {
        // Show header quickly when scrolling up
        if (diff > 10) {
          if (scrollDirection !== 'up') {
            setScrollDirection('up')
            setHeaderVisible(true)
          }
          lastScrollY.current = scrollY
        }
      }
    }

    window.addEventListener('scroll', updateScrollDirection)
    return () => {
      window.removeEventListener('scroll', updateScrollDirection)
    }
  }, [scrollDirection, setHeaderVisible])

  return isHeaderVisible
}
