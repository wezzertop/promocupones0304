'use client'

import SmartAdUnit from './SmartAdUnit'

export default function AdUnit() {
  const config = {
    key: '819d7d426081b34943bae0bc2695fd78',
    height: 600,
    width: 160,
    url: '//crateworkshop.com/819d7d426081b34943bae0bc2695fd78/invoke.js'
  }

  const fallback = (
    <div className="w-[160px] h-[600px] bg-gradient-to-b from-[#222222] to-[#222327] rounded-xl border border-[#2d2e33] flex flex-col items-center justify-center p-4 relative group cursor-pointer hover:border-[#07B5A7]/50 transition-colors">
        <div className="absolute inset-0 bg-[#07B5A7]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <span className="text-xs font-bold text-[#07B5A7] uppercase tracking-wider bg-[#07B5A7]/10 px-3 py-1 rounded-full">Publicidad</span>
            <p className="text-sm text-gray-400 font-medium">Espacio disponible para tu marca</p>
            <button className="text-xs bg-[#07B5A7] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#25b84e] transition-colors shadow-lg shadow-[#07B5A7]/20">
                Contáctanos
            </button>
        </div>
    </div>
  )

  return (
    <SmartAdUnit 
      config={config} 
      fallback={fallback}
    />
  )
}
