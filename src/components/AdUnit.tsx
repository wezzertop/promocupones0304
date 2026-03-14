'use client'

import { useEffect, useRef } from 'react'

export default function AdUnit() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Configuration for internal banners (fallback when external ads are blocked)
    const showInternalAd = true

    if (showInternalAd) {
        // Render internal ad
        const internalAd = document.createElement('div')
        internalAd.className = "w-full h-full bg-gradient-to-b from-[#18191c] to-[#222327] rounded-xl border border-[#2d2e33] flex flex-col items-center justify-center p-4 relative group cursor-pointer hover:border-[#2BD45A]/50 transition-colors"
        internalAd.innerHTML = `
            <div class="absolute inset-0 bg-[#2BD45A]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <div class="relative z-10 flex flex-col items-center text-center gap-4">
                <span class="text-xs font-bold text-[#2BD45A] uppercase tracking-wider bg-[#2BD45A]/10 px-3 py-1 rounded-full">Publicidad</span>
                <p class="text-sm text-gray-400 font-medium">Espacio disponible para tu marca</p>
                <button class="text-xs bg-[#2BD45A] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#25b84e] transition-colors shadow-lg shadow-[#2BD45A]/20">
                    Contáctanos
                </button>
            </div>
        `
        container.innerHTML = ''
        container.appendChild(internalAd)
        return
    }

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
