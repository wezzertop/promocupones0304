'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
  const desktopSidebarConfig = {
    key: '4953cfb6025750119b8d80f1f4031e44',
    height: 250,
    width: 300,
    url: 'https://crateworkshop.com/4953cfb6025750119b8d80f1f4031e44/invoke.js'
  }

  // Configuration for Desktop Feed (468x60)
  const desktopFeedConfig = {
    key: 'd2d4c8f711abc6418d6c13518f6b8a2b',
    height: 60,
    width: 468,
    url: 'https://crateworkshop.com/d2d4c8f711abc6418d6c13518f6b8a2b/invoke.js'
  }

  // Configuration for Mobile (320x50) - Used for both
  const mobileConfig = {
    key: '697423b9f3a8a2c8c8061efb60114534',
    height: 50,
    width: 320,
    url: 'https://crateworkshop.com/697423b9f3a8a2c8c8061efb60114534/invoke.js'
  }

  // Determine which config to use
  let config
  if (variant === 'sidebar') {
    config = desktopSidebarConfig
  } else {
    config = desktopFeedConfig
  }

  // Create the HTML content for the iframe
  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background-color: transparent; height: 100vh; overflow: hidden; }
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
  `

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && "my-4", 
      className
    )}>
      <div 
        className={cn(
          "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300 rounded-lg",
          config.width === 300 ? "w-[300px]" : (config.width === 320 ? "w-full max-w-[320px]" : "w-full max-w-[468px]")
        )}
        style={{ height: `${config.height}px` }}
      >
        <iframe
          key={`${variant}-${isMobile}-${config.key}`}
          srcDoc={adHtml}
          width={config.width}
          height={config.height}
          style={{ border: 'none', overflow: 'hidden', maxWidth: '100%', display: 'block' }}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  )
}
