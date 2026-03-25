'use client'

import { useState } from 'react'
import { giveReputationAction } from '@/app/usuario/actions'
import { Loader2, Star, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReputationButtonProps {
  receiverId: string
  receiverUsername: string
  currentUserId?: string
  hasAlreadyGiven: boolean
  userPoints: number
}

export default function ReputationButton({ 
  receiverId, 
  receiverUsername,
  currentUserId, 
  hasAlreadyGiven, 
  userPoints 
}: ReputationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const router = useRouter()
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const handleGivePoints = async (amount: number) => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }

    if (userPoints < amount) {
      setMessage({ type: 'error', text: 'No tienes suficientes puntos' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await giveReputationAction(receiverId, amount)
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error as string })
      } else {
        setMessage({ type: 'success', text: result.message as string })
        setShowOptions(false)
        router.refresh()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar la solicitud' })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUserId) {
    return (
      <button 
        onClick={() => router.push('/auth/login')}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors flex items-center gap-2"
      >
        <Star size={16} />
        Inicia sesión para dar puntos
      </button>
    )
  }

  if (currentUserId === receiverId) {
    return null
  }

  if (hasAlreadyGiven) {
    return (
      <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 flex items-center gap-2">
        <CheckIcon className="w-4 h-4" />
        Ya has valorado a este usuario
      </div>
    )
  }

  return (
    <div className="relative">
      {!showOptions ? (
        <button
          onClick={() => setShowOptions(true)}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-yellow-500/20"
        >
          <Trophy size={16} />
          Dar Puntos de Reputación
        </button>
      ) : (
        <div className="flex flex-col gap-3 bg-[#222222] p-4 rounded-xl border border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 duration-200 absolute top-0 left-0 z-50 min-w-[280px]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-white text-sm">Elige una cantidad</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Se descontarán de tus {userPoints} puntos disponibles
              </p>
            </div>
            <button 
              onClick={() => {
                setShowOptions(false)
                setMessage(null)
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {[1, 3, 5].map((amount) => (
              <button
                key={amount}
                onClick={() => handleGivePoints(amount)}
                disabled={loading || userPoints < amount}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                  ${userPoints >= amount 
                    ? 'bg-zinc-800 border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-750 text-white' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'}
                `}
              >
                <span className="text-lg font-bold text-yellow-500">+{amount}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">Puntos</span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
            </div>
          )}

          {message && (
            <div className={`text-xs p-2 rounded ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
