import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface NativeAdUnitProps {
  className?: string
  fallback?: React.ReactNode
}

export default function NativeAdUnit({ className, fallback }: NativeAdUnitProps) {
  const [adBlocked, setAdBlocked] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(300) // Default estimated height
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Timeout for mobile data silent packet drops
    timeoutRef.current = setTimeout(() => { 
        setAdBlocked(true)
    }, 8000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && event.data.startsWith('ad-resize:')) {
        const height = parseInt(event.data.split(':')[1], 10)
        if (height && height > 0) {
          setIframeHeight(height)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setAdBlocked(false)
        }
      } else if (event.data === 'ad-error-native') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAdBlocked(true)
      } else if (event.data === 'ad-loaded-native') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setAdBlocked(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!isMounted) return null

  if (adBlocked && fallback) {
    return <>{fallback}</>
  }

  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background-color: transparent; 
            overflow: hidden; 
            font-family: system-ui, sans-serif;
            width: 100%;
          }
          #container-wrapper {
            width: 100%;
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <div id="container-wrapper">
            <script async="async" data-cfasync="false" src="https://crateworkshop.com/fc8a8cf35db735c9df6dc87b1ce5c70f/invoke.js"></script>
            <div id="container-fc8a8cf35db735c9df6dc87b1ce5c70f"></div>
        </div>
        
        <script type="text/javascript">
          // Observer to send height to parent React app
          const wrapper = document.getElementById('container-wrapper');
          let lastHeight = 0;
          
          const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
              const rect = entry.contentRect;
              if (rect.height && rect.height !== lastHeight && rect.height > 20) {
                lastHeight = rect.height;
                window.parent.postMessage('ad-resize:' + (rect.height + 10), '*');
                window.parent.postMessage('ad-loaded-native', '*');
              }
            }
          });
          
          observer.observe(wrapper);
          
          // Fallback timer
          setTimeout(function() {
            if (lastHeight < 20) {
               window.parent.postMessage('ad-error-native', '*');
            }
          }, 6000);
        </script>
      </body>
    </html>
  `

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full",
      !className?.includes('my-') && !className?.includes('mb-') && !className?.includes('mt-') && "my-2 md:my-6", 
      className
    )}>
      <div 
        className={cn(
          "bg-transparent flex items-center justify-center overflow-hidden transition-all duration-300 rounded-xl w-full max-w-[320px]"
        )}
        style={{ height: `${iframeHeight}px` }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={adHtml}
          width="100%"
          height="100%"
          style={{ border: 'none', overflow: 'hidden', display: 'block' }}
          scrolling="no"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </div>
  )
}
