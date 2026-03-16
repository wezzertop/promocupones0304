'use client'

import SmartAdUnit from './SmartAdUnit'

export default function AdUnit() {
  const config = {
    key: 'd2607862d6bb61bda08e80b2c54ba2c6',
    height: 600,
    width: 160,
    url: 'https://www.highperformanceformat.com/d2607862d6bb61bda08e80b2c54ba2c6/invoke.js'
  }

  const fallback = (
    <div className="w-[160px] h-[600px] bg-gradient-to-b from-[#18191c] to-[#222327] rounded-xl border border-[#2d2e33] flex flex-col items-center justify-center p-4 relative group cursor-pointer hover:border-[#2BD45A]/50 transition-colors">
        <div className="absolute inset-0 bg-[#2BD45A]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <span className="text-xs font-bold text-[#2BD45A] uppercase tracking-wider bg-[#2BD45A]/10 px-3 py-1 rounded-full">Publicidad</span>
            <p className="text-sm text-gray-400 font-medium">Espacio disponible para tu marca</p>
            <button className="text-xs bg-[#2BD45A] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#25b84e] transition-colors shadow-lg shadow-[#2BD45A]/20">
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
