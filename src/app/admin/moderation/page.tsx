'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, AlertTriangle, Eye, ExternalLink, History } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createNotification } from '@/lib/notifications'
import { addKarmaPoints, POINT_SYSTEM } from '@/lib/moderation'

export default function ModerationPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyUser, setHistoryUser] = useState<any>(null)
  const [historyDeals, setHistoryDeals] = useState<any[]>([])
  
  const supabase = createClient()

  const fetchUserHistory = async (userId: string) => {
    if (!userId) return
    setHistoryLoading(true)
    setHistoryModalOpen(true)
    setHistoryUser(null)
    setHistoryDeals([])
    
    // Get user details
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    setHistoryUser(user)
    
    // Get last deals
    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, status, created_at, moderation_notes, deal_price')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (deals) setHistoryDeals(deals)
    
    setHistoryLoading(false)
  }

  const fetchPendingDeals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*, user:users!deals_user_id_fkey(username, karma_points)')
      .in('status', ['pending', 'revision'])
      .order('created_at', { ascending: false })

    if (data) {
      setDeals(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPendingDeals()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm('¿Estás seguro de aprobar esta publicación?')) return

    const { error } = await (supabase.from('deals') as any)
      .update({ 
        status: 'active',
        moderated_at: new Date().toISOString(),
        // moderated_by: session.user.id (Supabase can handle this with triggers or we pass it)
      })
      .eq('id', id)

    if (!error) {
      const deal = deals.find(d => d.id === id)
      
      if (deal) {
        // Add points to user
        await addKarmaPoints(deal.user_id, POINT_SYSTEM.POST_APPROVED, 'Publicación aprobada')
        
        // Update UI
        setDeals(deals.filter(d => d.id !== id))
        
        // Create notification
        await createNotification(
          deal.user_id,
          'post_approved',
          '¡Tu oferta ha sido aprobada!',
          `Tu publicación "${deal.title}" ya está visible para todos.`,
          `/oferta/${deal.id}`
        )
      }
    }
  }

  const handleReject = async () => {
    if (!selectedDeal || !rejectReason) return

    const { error } = await (supabase.from('deals') as any)
      .update({ 
        status: 'rejected',
        moderation_notes: rejectReason,
        moderated_at: new Date().toISOString()
      })
      .eq('id', selectedDeal.id)

    if (!error) {
      await createNotification(
        selectedDeal.user_id,
        'post_rejected',
        'Tu oferta no ha sido aprobada',
        `Razón: ${rejectReason}`,
        '#'
      )
      setDeals(deals.filter(d => d.id !== selectedDeal.id))
      setIsRejectModalOpen(false)
      setRejectReason('')
      setSelectedDeal(null)
    }
  }

  if (loading) return <div className="text-white">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Cola de Moderación</h1>
        <div className="bg-[#18191c] px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400">
          {deals.length} pendientes
        </div>
      </div>

      <div className="grid gap-6">
        {deals.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            No hay publicaciones pendientes de revisión.
          </div>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="bg-[#18191c] rounded-xl border border-white/5 overflow-hidden flex flex-col md:flex-row">
              {/* Image */}
              <div className="w-full md:w-64 h-48 md:h-auto relative bg-black/20 shrink-0">
                {deal.image_urls?.[0] ? (
                  <img 
                    src={deal.image_urls[0]} 
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white">
                  {deal.discount_percentage ? `-${deal.discount_percentage}%` : 'Oferta'}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white line-clamp-2">{deal.title}</h3>
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                      {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        deal.user?.karma_points > 500 ? 'bg-yellow-500' :
                        deal.user?.karma_points > 100 ? 'bg-blue-500' : 'bg-zinc-500'
                      }`}></span>
                      {deal.user?.username || 'Usuario desconocido'}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchUserHistory(deal.user_id)
                        }}
                        className="ml-1 text-zinc-500 hover:text-blue-400 transition-colors p-1"
                        title="Ver historial de usuario"
                      >
                        <History size={14} />
                      </button>
                      <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                        {deal.user?.karma_points || 0} pts
                      </span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[#2BD45A] font-bold">
                      ${deal.deal_price}
                    </span>
                    {deal.original_price && (
                      <span className="text-zinc-600 line-through text-xs">
                        ${deal.original_price}
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
                    {deal.description}
                  </p>
                  
                  {deal.deal_url && (
                    <div className="bg-black/30 p-2 rounded text-xs text-zinc-500 font-mono break-all mb-4 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {deal.deal_url}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleApprove(deal.id)}
                    className="flex-1 bg-[#2BD45A]/10 hover:bg-[#2BD45A]/20 text-[#2BD45A] px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Aprobar
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedDeal(deal)
                      setIsRejectModalOpen(true)
                    }}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" /> Rechazar
                  </button>
                  <button className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Rechazar Publicación</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Por favor indica la razón del rechazo. El usuario recibirá una notificación.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Razón del rechazo..."
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)}>
          <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Historial de Usuario</h3>
              <button onClick={() => setHistoryModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {historyLoading ? (
                <div className="flex justify-center py-8 text-zinc-500">Cargando información...</div>
              ) : (
                <div className="space-y-6">
                  {/* User Stats */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                      {historyUser?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{historyUser?.username}</div>
                      <div className="text-zinc-400 text-sm">{historyUser?.email}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-mono text-blue-400">{historyUser?.karma_points}</div>
                      <div className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Karma Points</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <History className="w-4 h-4 text-zinc-400" />
                      Últimas 10 Publicaciones
                    </h4>
                    <div className="space-y-2">
                      {historyDeals.length === 0 ? (
                         <p className="text-zinc-500 text-sm py-4 text-center bg-white/[0.02] rounded-xl border border-white/5">
                           Sin actividad reciente.
                         </p>
                      ) : (
                        historyDeals.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="text-white text-sm font-medium truncate">{item.title}</div>
                              <div className="text-zinc-500 text-xs mt-0.5">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                                item.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                item.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              }`}>
                                {item.status === 'active' ? 'Aprobado' : item.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                              </span>
                              {item.moderation_notes && (
                                <div className="group relative cursor-help">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-black/90 backdrop-blur border border-white/10 p-3 rounded-xl text-xs text-white hidden group-hover:block z-20 shadow-xl">
                                    <div className="font-bold mb-1 text-red-400">Motivo de rechazo:</div>
                                    {item.moderation_notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
