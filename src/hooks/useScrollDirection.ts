import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/lib/store'
import { usePathname } from 'next/navigation'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const { setHeaderVisible, isHeaderVisible } = useUIStore()
  const pathname = usePathname()
  
  // Use ref to persist last scroll position without re-triggering effect
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Disable scroll hide logic on specific pages
    // The user wants navigation to stay visible on these pages
    const alwaysVisibleRoutes = ['/oferta', '/perfil', '/ajustes', '/settings', '/publicar', '/login', '/registro', '/usuario']
    const shouldAlwaysShow = alwaysVisibleRoutes.some(route => pathname?.startsWith(route))

    if (shouldAlwaysShow) {
      setHeaderVisible(true)
      // We return early, so no scroll listener is added.
      // The cleanup function from the previous effect (if any) will remove the old listener.
      return
    }

    // Initialize with current scroll
    lastScrollY.current = window.scrollY

    const updateScrollDirection = () => {
      // Double check inside the handler to be safe
      if (alwaysVisibleRoutes.some(route => window.location.pathname.startsWith(route))) {
         return
      }

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
  }, [scrollDirection, setHeaderVisible, pathname])

  return isHeaderVisible
}
