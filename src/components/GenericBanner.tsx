'use client'

import { useState, useEffect } from 'react'
import { X, Flame, Tag, Ticket, MessageSquare, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Map icon names to components
const iconMap = {
  Flame,
  Tag,
  Ticket,
  MessageSquare,
  Sparkles
}

export type IconName = keyof typeof iconMap

interface GenericBannerProps {
  id: string
  title: React.ReactNode
  description: string
  iconName: IconName
  iconLabel: string
  iconColorClass?: string // e.g. "text-orange-500"
  iconBgClass?: string // e.g. "bg-orange-500/10"
  iconBorderClass?: string // e.g. "border-orange-500/20"
  gradientFrom?: string // e.g. "from-[#18191c]"
  gradientTo?: string // e.g. "to-[#222327]"
  glowColorClass?: string // e.g. "bg-orange-500"
}

export default function GenericBanner({
  id,
  title,
  description,
  iconName,
  iconLabel,
  iconColorClass = "text-[#2BD45A]",
  iconBgClass = "bg-[#2BD45A]/10",
  iconBorderClass = "border-[#2BD45A]/20",
  gradientFrom = "from-[#18191c]",
  gradientTo = "to-[#222327]",
  glowColorClass = "bg-[#2BD45A]"
}: GenericBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const storageKey = `banner_dismissed_${id}`
  const Icon = iconMap[iconName] || Sparkles

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(storageKey)
    if (dismissed === 'true') {
      setIsVisible(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-3xl p-8 border border-[#2d2e33] relative overflow-hidden group`}
        >
          <div className={`absolute top-0 right-0 w-64 h-64 ${glowColorClass} opacity-5 blur-[100px] rounded-full pointer-events-none`}></div>
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            title="Ocultar esta sección"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 max-w-2xl">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${iconBgClass} ${iconColorClass} text-xs font-bold uppercase tracking-wider mb-4 border ${iconBorderClass}`}>
              <Icon size={14} />
              {iconLabel}
            </span>
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              {title}
            </div>
            <p className="text-lg text-gray-400 max-w-lg">
              {description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
