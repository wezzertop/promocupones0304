'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, X, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface Alert {
  id: string
  keyword: string
  max_price: number | null
  is_active: boolean
  created_at: string
}

interface CreateAlertModalProps {
  isOpen: boolean
  onClose: () => void
  initialKeyword?: string
  userId: string
  alertToEdit?: Alert | null
  onSuccess?: (alert: Alert) => void
}

export default function CreateAlertModal({ isOpen, onClose, initialKeyword = '', userId, alertToEdit, onSuccess }: CreateAlertModalProps) {
  const [keyword, setKeyword] = useState('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (alertToEdit) {
        setKeyword(alertToEdit.keyword)
        setMaxPrice(alertToEdit.max_price ? alertToEdit.max_price.toString() : '')
      } else {
        setKeyword(initialKeyword)
        setMaxPrice('')
      }
      setError(null)
    }
  }, [isOpen, alertToEdit, initialKeyword])

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!keyword.trim()) {
      setError('Debes ingresar al menos una palabra clave')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (alertToEdit) {
        const { data, error: updateError } = await (supabase
          .from('deal_alerts') as any)
          .update({
            keyword: keyword.trim(),
            max_price: maxPrice ? parseFloat(maxPrice) : null,
          })
          .eq('id', alertToEdit.id)
          .select()

        if (updateError) throw updateError
        if (onSuccess && data) onSuccess(data[0] as Alert)
      } else {
        const { data, error: insertError } = await (supabase
          .from('deal_alerts') as any)
          .insert({
            user_id: userId,
            keyword: keyword.trim(),
            max_price: maxPrice ? parseFloat(maxPrice) : null,
            is_active: true
          })
          .select()

        if (insertError) throw insertError
        if (onSuccess && data) onSuccess(data[0] as Alert)
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      console.error('Error saving alert:', err)
      setError(alertToEdit ? 'Hubo un error al actualizar la alerta.' : 'Hubo un error al crear la alerta. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="relative z-[9999]">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-full max-w-md bg-background rounded-2xl md:rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#07B5A7]/10 flex items-center justify-center text-[#07B5A7]">
              <BellRing size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{alertToEdit ? 'Editar Alerta' : 'Crear Alerta'}</h2>
              <p className="text-xs text-zinc-400">Te avisaremos cuando haya ofertas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white px-1">¿Qué estás buscando?</label>
              <input
                type="text"
                placeholder="Ej. PlayStation 5, Laptop Gamer, Nike..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                autoFocus
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#07B5A7] focus:ring-1 focus:ring-[#07B5A7] transition-all"
              />
              <p className="text-[11px] text-zinc-500 px-1">Se enviará una notificación si el título contiene esta palabra.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white px-1">Precio máximo (Opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</span>
                <input
                  type="number"
                  placeholder="Sin límite"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#07B5A7] focus:ring-1 focus:ring-[#07B5A7] transition-all"
                />
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="mt-6 flex flex-col-reverse md:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:flex-1 py-3 px-6 rounded-xl font-bold bg-[#07B5A7] text-black hover:bg-[#069c90] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
                {alertToEdit ? 'Guardar Cambios' : 'Crear Alerta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
