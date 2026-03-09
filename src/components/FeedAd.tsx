'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FeedAdProps {
  className?: string
}

export default function FeedAd({ className }: FeedAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    const container = containerRef.current
    if (!container) return

    // Mobile Config
    const mobileConfig = {
      key: '697423b9f3a8a2c8c8061efb60114534',
      height: 50,
      width: 320,
      url: 'https://crateworkshop.com/697423b9f3a8a2c8c8061efb60114534/invoke.js'
    }

    // Desktop Config
    const desktopConfig = {
      key: '4019062959f736f8d1b350a78242d5ea',
      height: 90,
      width: 728,
      url: 'https://crateworkshop.com/4019062959f736f8d1b350a78242d5ea/invoke.js'
    }

    const config = isMobile ? mobileConfig : desktopConfig

    // Create iframe element
    const iframe = document.createElement('iframe')
    iframe.width = `${config.width}`
    iframe.height = `${config.height}`
    iframe.style.border = 'none'
    iframe.style.overflow = 'hidden'
    iframe.scrolling = 'no'
    // Important: Allow necessary permissions for ads
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation')
    
    // Clear container and append iframe first
    container.innerHTML = ''
    container.appendChild(iframe)

    // Write content directly to the iframe document
    try {
      const doc = iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background-color: transparent; }
              </style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : '${config.key}',
                  'format' : 'iframe',
                  'height' : ${config.height},
                  'width' : ${config.width},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="${config.url}"></script>
            </body>
          </html>
        `)
        doc.close()
      }
    } catch (e) {
      console.error('Error writing to ad iframe:', e)
    }

    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [isMobile, isMounted])

  if (!isMounted) return null

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 bg-[#18191c] rounded-xl md:rounded-3xl border border-[#2d2e33] overflow-hidden my-4",
      className
    )}>
      <div 
        ref={containerRef} 
        className={cn(
          "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300",
          isMobile ? "w-[320px] h-[50px]" : "w-[728px] h-[90px]"
        )}
      />
    </div>
  )
}
