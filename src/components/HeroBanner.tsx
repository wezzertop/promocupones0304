'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function HeroBanner() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem('hero_banner_dismissed')
    if (dismissed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('hero_banner_dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-[#18191c] to-[#222327] rounded-3xl p-8 border border-[#2d2e33] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2BD45A] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            title="Ocultar esta sección"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2BD45A]/10 text-[#2BD45A] text-xs font-bold uppercase tracking-wider mb-4 border border-[#2BD45A]/20">
              <Sparkles size={14} />
              Comunidad Oficial
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Descubre ofertas reales <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2BD45A] to-emerald-400">
                compartidas por gente como tú
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg">
              Únete a la comunidad de ahorradores más inteligente. Vota, comenta y comparte las mejores promociones de internet.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
