import { useState, useEffect } from 'react'
import { useUIStore } from '@/lib/store'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const { setHeaderVisible, isHeaderVisible } = useUIStore()

  useEffect(() => {
    let lastScrollY = window.scrollY

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      
      // Calculate difference from last UPDATE point, not last event
      const diff = Math.abs(scrollY - lastScrollY)

      if (diff > 10) {
        if (direction !== scrollDirection) {
          setScrollDirection(direction)
          const visible = scrollY < 50 || direction === 'up'
          setHeaderVisible(visible)
        }
        // Only update lastScrollY when we've moved enough to trigger a check
        // This allows accumulating delta for slow scrolls
        lastScrollY = scrollY > 0 ? scrollY : 0
      }
    }

    window.addEventListener('scroll', updateScrollDirection)
    return () => {
      window.removeEventListener('scroll', updateScrollDirection)
    }
  }, [scrollDirection, setHeaderVisible])

  return isHeaderVisible
}
