'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ArrowUp } from 'lucide-react'

export default function GamificationToast() {
  const [toasts, setToasts] = useState<{ id: string, type: 'xp' | 'level', message: string, amount?: number, isNegative?: boolean }[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Check if realtime is enabled/supported. 
    // Supabase Realtime uses WebSocket which might be blocked by strict CSP if wss:// is not allowed.
    // However, Supabase JS client handles this.
    
    // We need to fetch user first to avoid async issues inside the callback
    let userId: string | null = null;
    
    const setupSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        userId = user.id

        const channel = supabase
          .channel('gamification_updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'gamification_xp_history',
              filter: `user_id=eq.${userId}` // Filter server-side if RLS allows or just listen
            },
            (payload) => {
               const newXp = payload.new as any
               if (newXp.user_id === userId) {
                   const isPositive = newXp.amount > 0
                   addToast({
                     type: 'xp',
                     message: `${isPositive ? '+' : ''}${newXp.amount} XP`,
                     amount: newXp.amount,
                     isNegative: !isPositive
                   })
               }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
    }

    const cleanupPromise = setupSubscription()

    return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [supabase])

  const addToast = (toast: { type: 'xp' | 'level', message: string, amount?: number, isNegative?: boolean }) => {
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
              <div className={`p-2 rounded-full ${toast.isNegative ? 'bg-red-500/20 text-red-400' : 'bg-[#07B5A7]/20 text-[#07B5A7]'}`}>
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
