'use client'

import { useEffect, useRef } from 'react'

export default function AdUnit() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create an iframe to isolate the ad script (which likely uses document.write)
    const iframe = document.createElement('iframe')
    iframe.style.width = '160px'
    iframe.style.height = '600px'
    iframe.style.border = 'none'
    iframe.style.overflow = 'hidden'
    iframe.scrolling = 'no'
    // Ensure scripts can run
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups')
    
    // The ad content
    const adContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background-color: transparent; }</style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : 'd2607862d6bb61bda08e80b2c54ba2c6',
              'format' : 'iframe',
              'height' : 600,
              'width' : 160,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/d2607862d6bb61bda08e80b2c54ba2c6/invoke.js"></script>
        </body>
      </html>
    `

    iframe.srcdoc = adContent
    
    // Clear container and append iframe
    container.innerHTML = ''
    container.appendChild(iframe)

    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-[160px] h-[600px] bg-transparent flex items-center justify-center overflow-hidden"
    />
  )
}
