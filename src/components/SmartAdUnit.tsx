'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AdConfig {
  key: string
  height: number
  width: number
  url: string
}

interface SmartAdUnitProps {
  config: AdConfig
  className?: string
  fallback?: React.ReactNode
  variant?: string
  isMobile?: boolean
  isSidebar?: boolean
}

export default function SmartAdUnit({ 
  config, 
  className, 
  fallback,
  variant,
  isMobile,
  isSidebar
}: SmartAdUnitProps) {
  const [adBlocked, setAdBlocked] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Timeout ref to clear if loaded
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Re-enabled timeout for mobile data silent packet drops (ISPs block without firing onerror)
    timeoutRef.current = setTimeout(() => { 
        console.log('Ad load timed out, falling back:', config.key)
        setAdBlocked(true)
    }, 8000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [config.key])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin if possible, but ad scripts might come from various CDNs.
      // For now, check the data payload.
      if (event.data === `ad-error-${config.key}`) {
        console.log('Ad failed to load (error):', config.key)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAdBlocked(true)
      } else if (event.data === `ad-loaded-${config.key}`) {
        // Ad loaded successfully
        console.log('Ad loaded successfully:', config.key)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAdBlocked(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [config.key])

  if (!isMounted) return null

  if (adBlocked && fallback) {
    return <>{fallback}</>
  }

  // Ensure URL is HTTPS
  const secureUrl = config.url.startsWith('//') ? `https:${config.url}` : config.url

  // Create the HTML content for the iframe with improved error handling and polling
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
          function notifyLoaded() {
            window.parent.postMessage('ad-loaded-${config.key}', '*');
          }
          
          function notifyError() {
            window.parent.postMessage('ad-error-${config.key}', '*');
          }

          atOptions = {
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
          
          // Poll for content changes as a backup for onload
          var attempts = 0;
          var interval = setInterval(function() {
            attempts++;
            // Check if iframe exists or body has content height
            if (document.getElementsByTagName('iframe').length > 0 || document.body.scrollHeight > 10) {
               notifyLoaded();
               clearInterval(interval);
            }
            // Stop polling after 8 seconds
            if (attempts > 16) clearInterval(interval);
          }, 500);
        </script>
        <script 
          type="text/javascript" 
          src="${secureUrl}"
          onload="notifyLoaded()"
          onerror="notifyError()"
        ></script>
      </body>
    </html>
  `

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && !className?.includes('mb-') && !className?.includes('mt-') && "my-2 md:my-6", 
      isSidebar && "my-0",
      className
    )}>
      <div 
        className={cn(
          "bg-transparent flex items-center justify-center transition-all duration-300",
          "min-h-[50px] shrink-0"
        )}
        style={{ height: `${config.height}px`, width: `${config.width}px`, minWidth: `${config.width}px` }}
      >
        <iframe
          ref={iframeRef}
          key={`${variant}-${isMobile}-${isSidebar}-${config.key}`}
          srcDoc={adHtml}
          width={config.width}
          height={config.height}
          style={{ border: 'none', overflow: 'hidden', maxWidth: '100%', display: 'block' }}
          scrolling="no"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </div>
  )
}
