'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
    key: '697423b9f3a8a2c8c8061efb60114534',
    height: 50,
    width: 320,
    url: 'https://crateworkshop.com/697423b9f3a8a2c8c8061efb60114534/invoke.js'
  }

  // Desktop Config (468x60) - Used only for Banner1-Desktop
  const desktopConfig = {
    key: 'd2d4c8f711abc6418d6c13518f6b8a2b',
    height: 60,
    width: 468,
    url: 'https://crateworkshop.com/d2d4c8f711abc6418d6c13518f6b8a2b/invoke.js'
  }

  // Use mobile config if on mobile screen OR in a narrow sidebar OR it's Banner2
  const config = (variant === 'banner2' || isMobile || isSidebar) ? mobileConfig : desktopConfig

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
      // Remove specific margins here to control them better from parent
      // but keep a default safe margin if not specified
      !className?.includes('my-') && "my-6", 
      isSidebar && "my-0",
      className
    )}>
      <div 
        className={cn(
          "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300 min-h-[50px]",
          config.width === 320 ? "w-full max-w-[320px]" : "w-full max-w-[468px]"
        )}
        style={{ height: `${config.height}px` }}
      >
        <iframe
          key={`${variant}-${isMobile}-${isSidebar}-${config.key}`}
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
