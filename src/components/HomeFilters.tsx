'use client'

import { Flame, Clock, Sparkles } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HomeFilters({ dealsCount }: { dealsCount: number }) {
  const { isHeaderVisible } = useUIStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'foryou'

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', filter)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-16 z-20 bg-[#0f1012]/95 backdrop-blur-xl py-4 -mx-2 px-2 md:-mx-4 md:px-4 lg:-mx-8 lg:px-8 border-b border-[#2d2e33]/50 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="flex items-center gap-2 p-1 bg-[#18191c] rounded-xl border border-[#2d2e33] overflow-x-auto max-w-full scrollbar-hide">
        <button 
          onClick={() => handleFilterChange('foryou')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'foryou' 
              ? 'bg-[#222327] text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-[#222327]'
          }`}
        >
          <Sparkles size={16} className={currentFilter === 'foryou' ? "text-[#2BD45A]" : ""} />
          Para ti
        </button>
        <button 
          onClick={() => handleFilterChange('popular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'popular' 
              ? 'bg-[#222327] text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-[#222327]'
          }`}
        >
          <Flame size={16} className={currentFilter === 'popular' ? "text-orange-500" : ""} />
          Más votadas
        </button>
        <button 
          onClick={() => handleFilterChange('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'recent' 
              ? 'bg-[#222327] text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-[#222327]'
          }`}
        >
          <Clock size={16} className={currentFilter === 'recent' ? "text-blue-500" : ""} />
          Recientes
        </button>
      </div>
      
      <div className="text-sm text-gray-500 font-medium">
        Mostrando <span className="text-white">{dealsCount}</span> ofertas activas
      </div>
    </div>
  )
}
