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
    <div className={`hidden sm:flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4 sticky top-14 z-20 bg-background/95 backdrop-blur-xl py-1 md:py-4 -mx-2 px-2 md:-mx-4 md:px-4 lg:-mx-8 lg:px-8 border-b border-border/50 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-border overflow-x-auto max-w-full scrollbar-hide w-full sm:w-auto justify-center">
        <button 
          onClick={() => handleFilterChange('foryou')}
          className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'foryou' 
              ? 'bg-surface-hover text-foreground shadow-sm' 
              : 'text-gray-400 hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <Sparkles size={14} className={`md:w-4 md:h-4 ${currentFilter === 'foryou' ? "text-[#07B5A7]" : ""}`} />
          Para ti
        </button>
        <button 
          onClick={() => handleFilterChange('popular')}
          className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'popular' 
              ? 'bg-surface-hover text-foreground shadow-sm' 
              : 'text-gray-400 hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <Flame size={14} className={`md:w-4 md:h-4 ${currentFilter === 'popular' ? "text-orange-500" : ""}`} />
          Más votadas
        </button>
        <button 
          onClick={() => handleFilterChange('recent')}
          className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
            currentFilter === 'recent' 
              ? 'bg-surface-hover text-foreground shadow-sm' 
              : 'text-gray-400 hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <Clock size={14} className={`md:w-4 md:h-4 ${currentFilter === 'recent' ? "text-blue-500" : ""}`} />
          Recientes
        </button>
      </div>
      
      <div className="hidden sm:block text-sm text-gray-500 font-medium">
        Mostrando <span className="text-foreground">{dealsCount}</span> ofertas activas
      </div>
    </div>
  )
}
