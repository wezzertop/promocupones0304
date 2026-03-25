'use client'

import { useState } from 'react'
import { BellRing } from 'lucide-react'
import CreateAlertModal from './CreateAlertModal'

interface SearchAlertButtonProps {
  initialKeyword: string
  userId: string
}

export default function SearchAlertButton({ initialKeyword, userId }: SearchAlertButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#07B5A7]/10 hover:bg-[#07B5A7]/20 text-[#07B5A7] font-medium rounded-xl border border-[#07B5A7]/20 transition-all"
      >
        <BellRing size={16} />
        <span className="text-sm">Crear Alerta</span>
      </button>

      {/* Botón flotante para móvil (se mostraría cerca del fondo o en resultados) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden flex items-center justify-center w-12 h-12 bg-[#07B5A7] text-[#161616] rounded-full fixed bottom-20 right-4 z-[90] active:scale-95 transition-all shadow-lg"
        aria-label="Crear Alerta"
      >
        <BellRing size={20} className="fill-current" />
      </button>

      <CreateAlertModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialKeyword={initialKeyword} 
        userId={userId} 
      />
    </>
  )
}
