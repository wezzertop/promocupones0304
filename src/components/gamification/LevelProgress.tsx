'use client'

import { useState, useEffect } from 'react'
import { GamificationProfile } from '@/types'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap, Info, MessageSquare, ThumbsUp, ShoppingBag, HelpCircle } from 'lucide-react'
import { calculateLevelProgress, getReferralLimit, calculateXpToNextLevel } from '@/lib/gamification-utils'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface LevelProgressProps {
  profile: GamificationProfile
}

export default function LevelProgress({ profile }: LevelProgressProps) {
  const { current_level, current_xp, next_level_xp, level } = profile
  const [chartData, setChartData] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ deals: 0, comments: 0, likes_received: 0 })
  const supabase = createClient()
  
  const floor = level?.xp_required || 0
  const ceiling = next_level_xp
  
  const progress = calculateLevelProgress(current_xp, floor, ceiling)
  const referralLimit = getReferralLimit(current_level)
  const xpNeeded = calculateXpToNextLevel(current_xp, ceiling)

  useEffect(() => {
    // Fetch Chart Data
    fetch('/api/gamification/chart?days=7')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChartData(data)
      })
      .catch(err => console.error('Error fetching chart:', err))

    // Claim Daily Bonus & Get Streak & Stats
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Streak
        const { data: streakData } = await (supabase.rpc as any)('claim_daily_bonus', { p_user_id: user.id })
        if (streakData) {
          setStreak(streakData.streak)
          if (streakData.xp_awarded > 0) {
            console.log(streakData.message)
          }
        }

        // Stats (This should ideally be a single RPC or efficient query, doing separate for MVP speed)
        // We can use count()
        const { count: dealsCount } = await (supabase.from('deals') as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: commentsCount } = await (supabase.from('comments') as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        
        // Likes received is harder without a direct counter on user or aggregation.
        // Let's approximate or skip if expensive. 
        // Or we can count total XP from 'vote' source in history? No that's giving votes.
        // Receiving votes: we need to sum likes on user's deals/comments. Expensive.
        // Let's use "Votos Dados" (Votes given) which corresponds to XP history source 'vote'.
        // Or "Puntos Ganados" total.
        
        // Let's just show Deals and Comments for now which are cheap.
        setStats({ 
            deals: dealsCount || 0, 
            comments: commentsCount || 0, 
            likes_received: 0 // Placeholder
        })
      }
    }
    initData()
  }, [supabase])
  
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Nivel Actual</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2BD45A]">{current_level}</span>
              <span className="text-lg font-normal text-zinc-500">/ {level?.title || 'Usuario'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Streak Badge with Tooltip */}
             <div className="group relative bg-black/40 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[100px] cursor-help transition-colors hover:border-[#2BD45A]/30">
                <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                    <Zap size={12} className="text-yellow-500" fill="currentColor" />
                    Racha
                </div>
                <div className="text-xl font-bold text-white">{streak} días</div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 w-48 bg-zinc-900 border border-white/10 rounded-lg p-3 text-xs text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="font-bold text-white mb-1">Bonus Diario</div>
                    Conéctate cada día para ganar más XP. <br/>
                    <span className="text-[#2BD45A]">Máx: 50 XP/día (10 días)</span>
                </div>
             </div>

             <Link href="/logros" className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/40 border border-white/5 hover:bg-black/60 hover:text-[#2BD45A] transition-colors" title="Reglas y Logros">
                <HelpCircle size={20} />
             </Link>
          </div>
        </div>
        
        <div className="mb-2 flex justify-between text-xs text-zinc-400 font-mono">
          <span>{current_xp.toLocaleString()} XP</span>
          <span>{ceiling.toLocaleString()} XP</span>
        </div>
        
        <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-8 relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#2BD45A] to-[#32E865]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-black/20 rounded-xl border border-white/5 p-4 h-[200px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-zinc-400 font-semibold">Actividad Reciente (XP)</div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400" title="Ofertas publicadas">
                            <ShoppingBag size={12} /> {stats.deals}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400" title="Comentarios realizados">
                            <MessageSquare size={12} /> {stats.comments}
                        </div>
                    </div>
                </div>
                <div className="h-[150px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2BD45A" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2BD45A" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                    dy={10}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ stroke: '#27272a' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="xp" 
                                    stroke="#2BD45A" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorXp)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                            No hay actividad reciente
                        </div>
                    )}
                </div>
            </div>

            {/* Stats / Next Level */}
            <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-[92px] flex flex-col justify-center relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-xs text-zinc-400 mb-1">Próximo Nivel</div>
                        <div className="text-[#2BD45A] font-bold text-lg">
                            {xpNeeded.toLocaleString()} XP
                        </div>
                        <div className="text-[10px] text-zinc-500">necesarios para subir</div>
                    </div>
                    <div className="absolute right-0 bottom-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star className="w-12 h-12" />
                    </div>
                </div>
                
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-[92px] flex flex-col justify-center">
                    <div className="text-xs text-zinc-400 mb-1">Límite de Referidos</div>
                    <div className="text-white font-bold flex items-center justify-between">
                        <span>
                        {referralLimit > 0 ? (
                            <span className="text-[#2BD45A] text-lg">{referralLimit} <span className="text-sm text-zinc-500 font-normal">/semana</span></span>
                        ) : (
                            <span className="text-zinc-500">Bloqueado</span>
                        )}
                        </span>
                    </div>
                    {referralLimit === 0 && <div className="text-[10px] text-zinc-500">Desbloquea en Nivel 10</div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
