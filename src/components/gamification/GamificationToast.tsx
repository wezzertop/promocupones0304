'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ArrowUp } from 'lucide-react'

export default function GamificationToast() {
  const [toasts, setToasts] = useState<{ id: string, type: 'xp' | 'level', message: string, amount?: number, isNegative?: boolean }[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to XP History changes
    const channel = supabase
      .channel('gamification_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gamification_xp_history',
        },
        (payload) => {
          // Check if it belongs to current user
          // Note: RLS might prevent receiving others' data, but we should filter just in case
          // or better: The client subscription will automatically filter by RLS if properly set up?
          // Actually, realtime usually bypasses RLS unless configured with "row level security" on publication.
          // For now let's assume we get the event. 
          // Wait, `payload.new` will have `user_id`.
          
          const newXp = payload.new as any
          
          // We need the current user ID to filter
          // But inside useEffect we might not have it easily without a fetch.
          // Let's rely on a quick check.
          
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && user.id === newXp.user_id) {
               const isPositive = newXp.amount > 0
               addToast({
                 type: 'xp',
                 message: `${isPositive ? '+' : ''}${newXp.amount} XP`,
                 amount: newXp.amount,
                 isNegative: !isPositive
               })
            }
          })
        }
      )
      .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'gamification_profiles',
            filter: 'current_level=gt.1' // Only if level > 1 (simplistic filter, better done in code)
        },
        (payload) => {
            const oldProfile = payload.old as any
            const newProfile = payload.new as any
            
             supabase.auth.getUser().then(({ data: { user } }) => {
                if (user && user.id === newProfile.user_id) {
                    // Check if level increased
                    if (newProfile.current_level > (oldProfile.current_level || 0)) {
                        addToast({
                            type: 'level',
                            message: `¡Nivel ${newProfile.current_level} Alcanzado!`,
                        })
                    }
                }
             })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const addToast = (toast: Omit<{ type: 'xp' | 'level', message: string, amount?: number, isNegative?: boolean }, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id))
    }, 4000)
  }

  // We don't need removeToast exposed, handled inside addToast logic

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md
              ${toast.type === 'level' 
                ? 'bg-gradient-to-r from-yellow-600/90 to-amber-800/90 border-yellow-500/50 text-white' 
                : toast.isNegative 
                  ? 'bg-red-900/90 border-red-500/30 text-white'
                  : 'bg-zinc-900/90 border-white/10 text-white'
              }
            `}
          >
            {toast.type === 'level' ? (
              <div className="p-2 bg-yellow-400/20 rounded-full text-yellow-300">
                <Trophy size={20} />
              </div>
            ) : (
              <div className={`p-2 rounded-full ${toast.isNegative ? 'bg-red-500/20 text-red-400' : 'bg-[#2BD45A]/20 text-[#2BD45A]'}`}>
                {toast.isNegative ? <ArrowUp className="rotate-180" size={16} /> : <Star size={16} />}
              </div>
            )}
            
            <div>
              <div className="font-bold text-sm">{toast.message}</div>
              {toast.type === 'xp' && (
                <div className={`text-xs ${toast.isNegative ? 'text-red-300' : 'text-zinc-400'}`}>
                  {toast.isNegative ? 'Penalización aplicada' : '¡Sigue así!'}
                </div>
              )}
              {toast.type === 'level' && (
                <div className="text-xs text-yellow-200/80">Nuevas recompensas desbloqueadas</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
