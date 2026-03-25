'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function ProfileTabs() {
  const { addToast } = useUIStore()

  const handleComingSoon = (feature: string) => {
    addToast({
      type: 'info',
      message: 'Próximamente',
      description: `La sección de ${feature} estará disponible muy pronto.`,
      duration: 3000
    })
  }

  return (
    <div className="flex items-center gap-1 border-b border-[#2d2e33] overflow-x-auto scrollbar-hide px-1 md:px-2 pt-1">
      <Link 
        href="/mis-publicaciones"
        className="px-4 md:px-6 py-3 text-xs md:text-sm font-bold text-white border-b-2 border-[#07B5A7] bg-[#07B5A7]/5 rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0"
      >
        Gestionar Publicaciones
        <ExternalLink size={14} />
      </Link>
      <button 
        onClick={() => handleComingSoon('Guardados')}
        className="px-4 md:px-6 py-3 text-xs md:text-sm font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap shrink-0 hover:bg-[#222327] rounded-t-lg"
      >
        Guardados
      </button>
      <button 
        onClick={() => handleComingSoon('Comentarios')}
        className="px-4 md:px-6 py-3 text-xs md:text-sm font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap shrink-0 hover:bg-[#222327] rounded-t-lg"
      >
        Comentarios
      </button>
    </div>
  )
}
