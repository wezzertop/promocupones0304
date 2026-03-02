'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Star, User } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_xp: number
  current_level: number
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const res = await fetch(`/api/gamification/leaderboard?period=${period}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboard()
  }, [period])

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 1) return <Medal className="w-6 h-6 text-zinc-300" />
    if (rank === 2) return <Medal className="w-6 h-6 text-amber-700" />
    return <span className="text-zinc-500 font-bold w-6 text-center">{rank + 1}</span>
  }

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#2BD45A]" />
          Tabla de Clasificación
        </h3>
        
        <div className="flex bg-black/40 rounded-lg p-1">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              period === 'weekly' 
                ? 'bg-[#2BD45A] text-black font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              period === 'monthly' 
                ? 'bg-[#2BD45A] text-black font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriod('all_time')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              period === 'all_time' 
                ? 'bg-[#2BD45A] text-black font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Histórico
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center justify-between p-4 rounded-xl border transition-all
                ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/20' : ''}
                ${index === 1 ? 'bg-zinc-400/10 border-zinc-400/20' : ''}
                ${index === 2 ? 'bg-amber-700/10 border-amber-700/20' : ''}
                ${index > 2 ? 'bg-black/20 border-white/5 hover:bg-zinc-800/50' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden border border-white/10">
                    {entry.avatar_url ? (
                      <Image 
                        src={entry.avatar_url} 
                        alt={entry.username} 
                        width={40} 
                        height={40} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-800 font-bold text-sm">
                        {entry.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black rounded-full border border-zinc-800 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white">
                    {entry.current_level}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-white">{entry.username}</div>
                  <div className="text-xs text-zinc-400">Nivel {entry.current_level}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono font-bold text-[#2BD45A]">
                  {entry.total_xp.toLocaleString()} XP
                </div>
              </div>
            </motion.div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              No hay datos disponibles para este periodo.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
