'use client'

import { Badge, UserBadge } from '@/types'
import { motion } from 'framer-motion'
import { Lock, Check } from 'lucide-react'
import Image from 'next/image'

interface BadgeListProps {
  badges: Badge[]
  userBadges: UserBadge[]
}

export default function BadgeList({ badges, userBadges }: BadgeListProps) {
  // Check if user has earned a badge
  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId)
  }

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span>Insignias</span>
        <span className="text-sm bg-[#2BD45A]/20 text-[#2BD45A] px-2 py-0.5 rounded-full font-medium">
          {userBadges.length} / {badges.length}
        </span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map((badge, index) => {
          const earned = hasBadge(badge.id)
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative group rounded-xl p-4 flex flex-col items-center text-center
                border transition-all duration-300
                ${earned 
                  ? 'bg-zinc-800/50 border-[#2BD45A]/30 hover:border-[#2BD45A]/60' 
                  : 'bg-black/30 border-white/5 opacity-60 grayscale'
                }
              `}
            >
              {earned && (
                <div className="absolute top-2 right-2 text-[#2BD45A]">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              {!earned && (
                <div className="absolute top-2 right-2 text-zinc-600">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              
              <div className="w-12 h-12 mb-3 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                {badge.icon_url ? (
                  <Image 
                    src={badge.icon_url} 
                    alt={badge.name} 
                    width={48} 
                    height={48} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl">🏅</div>
                )}
              </div>
              
              <h4 className={`text-sm font-semibold mb-1 ${earned ? 'text-white' : 'text-zinc-500'}`}>
                {badge.name}
              </h4>
              
              <p className="text-xs text-zinc-400 line-clamp-2 mb-2 h-8">
                {badge.description}
              </p>
              
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 bg-black/40 px-2 py-1 rounded-full w-full">
                +{badge.xp_reward} XP
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
