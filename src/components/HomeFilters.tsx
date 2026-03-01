'use client'

import { Flame, Clock, Sparkles } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function HomeFilters({ dealsCount }: { dealsCount: number }) {
  const { isHeaderVisible } = useUIStore()

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-16 z-20 bg-[#0f1012]/95 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-[#2d2e33]/50 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="flex items-center gap-2 p-1 bg-[#18191c] rounded-xl border border-[#2d2e33]">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#222327] text-white text-sm font-medium shadow-sm transition-all">
          <Sparkles size={16} className="text-[#2BD45A]" />
          Para ti
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222327] text-sm font-medium transition-all">
          <Flame size={16} />
          Más votadas
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222327] text-sm font-medium transition-all">
          <Clock size={16} />
          Recientes
        </button>
      </div>
      
      <div className="text-sm text-gray-500 font-medium">
        Mostrando <span className="text-white">{dealsCount}</span> ofertas activas
      </div>
    </div>
  )
}
