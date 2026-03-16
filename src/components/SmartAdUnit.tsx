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

  useEffect(() => {
    setIsMounted(true)
    
    // Simple ad blocker detection via fetch
    // Note: This might be blocked by CORS if the ad server doesn't allow it,
    // but usually ad scripts are served with CORS headers or we can just try to load it.
    // If it fails with network error, it's likely blocked.
    const checkAdBlocker = async () => {
      try {
        // Ensure URL is HTTPS
        const url = config.url.startsWith('//') ? `https:${config.url}` : config.url
        
        // We can't really fetch the script due to CORS likely, but we can try HEAD if allowed.
        // If not allowed, we rely on iframe error handling.
        // Actually, many ad blockers block the request at the network level.
        // A better check is to see if the global variable from the ad script is present,
        // but since it's in an iframe, we can't easily check that from here.
        
        // Let's use the iframe message approach.
      } catch (e) {
        console.log('Ad check failed', e)
        // Don't set blocked yet, let the iframe try.
      }
    }

    checkAdBlocker()
  }, [config.url])

  useEffect(() => {
    if (!iframeRef.current) return

    const handleMessage = (event: MessageEvent) => {
      // Verify origin if possible, but ad scripts might come from various CDNs.
      // For now, check the data payload.
      if (event.data === `ad-error-${config.key}`) {
        console.log('Ad failed to load:', config.key)
        setAdBlocked(true)
      } else if (event.data === `ad-loaded-${config.key}`) {
        // Ad loaded successfully
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

  // Create the HTML content for the iframe with error handling
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
          // Notify parent of error
          window.onerror = function() {
            window.parent.postMessage('ad-error-${config.key}', '*');
          };

          atOptions = {
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script 
          type="text/javascript" 
          src="${secureUrl}"
          onload="window.parent.postMessage('ad-loaded-${config.key}', '*')"
          onerror="window.parent.postMessage('ad-error-${config.key}', '*')"
        ></script>
      </body>
    </html>
  `

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && "my-6", 
      isSidebar && "my-0",
      className
    )}>
      <div 
        className={cn(
          "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300",
          "min-h-[50px] rounded-lg", // Add rounded corners and min-height
           // Responsive widths based on config
           config.width === 300 ? "w-[300px]" : 
           config.width === 320 ? "w-full max-w-[320px]" : 
           config.width === 728 ? "w-full max-w-[728px]" : 
           "w-full max-w-[468px]"
        )}
        style={{ height: `${config.height}px` }}
      >
        <iframe
          ref={iframeRef}
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
