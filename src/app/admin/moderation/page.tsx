'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, AlertTriangle, Eye, ExternalLink, History, Trash2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { addKarmaPoints, POINT_SYSTEM } from '@/lib/moderation'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { cn } from '@/lib/utils'

export default function ModerationPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set())
  
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
      .select('*, user:users!deals_user_id_fkey(username, karma_points, avatar_url), store:stores(*), category:categories(*)')
      .in('status', ['pending', 'revision'])
      .order('created_at', { ascending: false })

    if (data) {
      setDeals(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPendingDeals()
  }, [])

  const handleApprove = async (id: string) => {
    // if (!confirm('¿Estás seguro de aprobar esta publicación?')) return

    const { error } = await (supabase.from('deals') as any)
      .update({ 
        status: 'active',
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      const deal = deals.find(d => d.id === id)
      
      if (deal) {
        // Add points to user
        await addKarmaPoints(deal.user_id, POINT_SYSTEM.POST_APPROVED, 'Publicación aprobada')
        
        // Update UI
        setDeals(prev => prev.filter(d => d.id !== id))
        setSelectedDeals(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
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
      setDeals(prev => prev.filter(d => d.id !== selectedDeal.id))
      setSelectedDeals(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedDeal.id)
        return newSet
      })
      setIsRejectModalOpen(false)
      setRejectReason('')
      setSelectedDeal(null)
    }
  }

  const toggleSelectDeal = (id: string) => {
    setSelectedDeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedDeals.size === deals.length) {
      setSelectedDeals(new Set())
    } else {
      setSelectedDeals(new Set(deals.map(d => d.id)))
    }
  }

  const handleBulkApprove = async () => {
    if (selectedDeals.size === 0) return
    if (!confirm(`¿Estás seguro de aprobar ${selectedDeals.size} publicaciones?`)) return

    const ids = Array.from(selectedDeals)
    
    // Update status
    const { error } = await (supabase.from('deals') as any)
      .update({ 
        status: 'active',
        moderated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (!error) {
      // Add karma points for each user (this might need optimization for large batches, but fine for now)
      for (const id of ids) {
        const deal = deals.find(d => d.id === id)
        if (deal) {
           await addKarmaPoints(deal.user_id, POINT_SYSTEM.POST_APPROVED, 'Publicación aprobada')
        }
      }

      setDeals(prev => prev.filter(d => !selectedDeals.has(d.id)))
      setSelectedDeals(new Set())
    }
  }

  const handleBulkReject = async () => {
    if (selectedDeals.size === 0) return
    // For bulk reject, we might want to ask for a common reason or just reject without notes?
    // Or open a modal for common reason.
    // For now, let's open the modal and apply to all selected.
    
    // If multiple selected, use the modal but apply to all
    setRejectReason('')
    // We need a way to tell the modal we are rejecting multiple.
    // Let's use a special flag or just check selectedDeals in the modal action
    setIsRejectModalOpen(true)
  }
  
  const confirmBulkReject = async () => {
    if (selectedDeals.size === 0 || !rejectReason) return

    const ids = Array.from(selectedDeals)
    
    const { error } = await (supabase.from('deals') as any)
      .update({ 
        status: 'rejected',
        moderation_notes: rejectReason,
        moderated_at: new Date().toISOString()
      })
      .in('id', ids)

    if (!error) {
      setDeals(prev => prev.filter(d => !selectedDeals.has(d.id)))
      setSelectedDeals(new Set())
      setIsRejectModalOpen(false)
      setRejectReason('')
    }
  }

  if (loading) return <div className="text-white animate-pulse">Cargando publicaciones...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-lg">
        <div className="flex items-center gap-4">
           <Link 
             href="/" 
             className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
             title="Volver al Inicio"
           >
             <ArrowLeft size={20} />
           </Link>
           <div>
             <h1 className="text-2xl md:text-3xl font-bold text-white">Cola de Moderación</h1>
             <p className="text-zinc-400 text-sm">{deals.length} publicaciones pendientes</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {deals.length > 0 && (
             <div className="flex items-center gap-2 mr-auto md:mr-0">
               <input 
                 type="checkbox" 
                 checked={deals.length > 0 && selectedDeals.size === deals.length}
                 onChange={toggleSelectAll}
                 className="w-5 h-5 rounded border-zinc-600 text-[#2BD45A] focus:ring-[#2BD45A] bg-zinc-800"
               />
               <span className="text-sm text-zinc-300">Seleccionar todo</span>
             </div>
          )}

          {selectedDeals.size > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkApprove}
                className="bg-[#2BD45A] hover:bg-[#25b84e] text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Check size={16} /> <span className="hidden sm:inline">Aprobar ({selectedDeals.size})</span>
              </button>
              <button 
                onClick={handleBulkReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <X size={16} /> <span className="hidden sm:inline">Rechazar ({selectedDeals.size})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {deals.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 mx-auto text-zinc-600">
               <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¡Todo limpio!</h3>
            <p className="max-w-md mx-auto">No hay publicaciones pendientes de revisión en este momento.</p>
          </div>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="relative group flex gap-3">
               {/* Selection Checkbox */}
               <div className="pt-8 md:pt-12 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={selectedDeals.has(deal.id)}
                    onChange={() => toggleSelectDeal(deal.id)}
                    className="w-5 h-5 rounded border-zinc-600 text-[#2BD45A] focus:ring-[#2BD45A] bg-zinc-800 cursor-pointer"
                  />
               </div>
               
               <div className="flex-1 min-w-0">
                  <DealCard 
                    deal={deal}
                    variant="moderation"
                    onApprove={() => handleApprove(deal.id)}
                    onReject={() => {
                      setSelectedDeal(deal)
                      setIsRejectModalOpen(true)
                    }}
                  />
                  
                  {/* Additional Moderation Info/Actions Overlay if needed */}
                  <div className="absolute top-2 right-2 md:right-4 flex gap-2">
                     <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchUserHistory(deal.user_id)
                        }}
                        className="bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white p-2 rounded-full backdrop-blur-sm transition-all border border-white/10 z-20"
                        title="Ver historial de usuario"
                      >
                        <History size={16} />
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
          <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedDeal ? 'Rechazar Publicación' : `Rechazar ${selectedDeals.size} Publicaciones`}
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Por favor indica la razón del rechazo. El usuario recibirá una notificación.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Razón del rechazo..."
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                   setIsRejectModalOpen(false)
                   setSelectedDeal(null)
                   setRejectReason('')
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={selectedDeal ? handleReject : confirmBulkReject}
                disabled={!rejectReason}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
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
          <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#09090b]">
              <h3 className="text-xl font-bold text-white">Historial de Usuario</h3>
              <button onClick={() => setHistoryModalOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-[#09090b]">
              {historyLoading ? (
                <div className="flex justify-center py-8 text-zinc-500 animate-pulse">Cargando información...</div>
              ) : (
                <div className="space-y-6">
                  {/* User Stats */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white ring-4 ring-black/50">
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
                         <p className="text-zinc-500 text-sm py-8 text-center bg-white/[0.02] rounded-xl border border-white/5">
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
                              <span className={cn(
                                "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                                item.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                item.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              )}>
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
