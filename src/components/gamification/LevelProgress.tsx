'use client'

import { GamificationProfile } from '@/types'
import { motion } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'
import { calculateLevelProgress, getReferralLimit, calculateXpToNextLevel } from '@/lib/gamification-utils'

interface LevelProgressProps {
  profile: GamificationProfile
}

export default function LevelProgress({ profile }: LevelProgressProps) {
  const { current_level, current_xp, next_level_xp, level } = profile
  
  const floor = level?.xp_required || 0
  const ceiling = next_level_xp
  
  const progress = calculateLevelProgress(current_xp, floor, ceiling)
  const referralLimit = getReferralLimit(current_level)
  const xpNeeded = calculateXpToNextLevel(current_xp, ceiling)
  
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Nivel Actual</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2BD45A]">{current_level}</span>
              <span className="text-lg font-normal text-zinc-500">/ {level?.title || 'Usuario'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400 mb-1">XP Total</div>
            <div className="text-xl font-mono text-white">{current_xp.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="mb-2 flex justify-between text-xs text-zinc-400">
          <span>{floor.toLocaleString()} XP</span>
          <span>{ceiling.toLocaleString()} XP</span>
        </div>
        
        <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-6">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#2BD45A] to-[#32E865]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-xs text-zinc-400 mb-1">Próximo Nivel</div>
                <div className="text-[#2BD45A] font-bold">
                    {xpNeeded.toLocaleString()} XP faltantes
                </div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-xs text-zinc-400 mb-1">Límite de Enlaces Referidos</div>
                <div className="text-white font-bold flex items-center justify-between">
                    <span>
                      {referralLimit > 0 ? (
                        <span className="text-[#2BD45A]">Límite: {referralLimit}/semana</span>
                      ) : (
                        <span className="text-zinc-500">Bloqueado (Nivel 10+)</span>
                      )}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
