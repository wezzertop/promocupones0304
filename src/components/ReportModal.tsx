'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/store'
import { Flag, Loader2, X, AlertTriangle } from 'lucide-react'
import { submitReport } from '@/app/report/actions'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetId: string
  targetType: 'deal' | 'comment'
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam o Publicidad no deseada' },
  { value: 'fake', label: 'Oferta falsa o engañosa' },
  { value: 'expired', label: 'Oferta expirada' },
  { value: 'offensive', label: 'Contenido ofensivo o inapropiado' },
  { value: 'duplicate', label: 'Publicación duplicada' },
  { value: 'other', label: 'Otro motivo' },
]

export default function ReportModal({ isOpen, onClose, targetId, targetType }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { addToast } = useUIStore()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('target_id', targetId)
      formData.append('target_type', targetType)
      formData.append('reason', reason)
      formData.append('description', description)

      const result = await submitReport(null, formData)

      if (result?.error) {
         // Handle error object or string
         const msg = typeof result.error === 'string' 
           ? result.error 
           : 'Error al enviar el reporte. Verifica los campos.'
         throw new Error(msg)
      }

      addToast({
        type: 'success',
        message: 'Reporte enviado',
        description: 'Gracias por tu reporte. Nuestro equipo lo revisará pronto.'
      })
      onClose()
    } catch (error: any) {
      console.error('Error reporting:', error)
      addToast({
        type: 'error',
        message: 'Error al enviar reporte',
        description: error.message || 'Ocurrió un error al enviar el reporte.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Flag className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Reportar Contenido</h3>
            <p className="text-sm text-zinc-400">Ayúdanos a mantener la comunidad segura</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Motivo del reporte
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-red-500 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                    required
                  />
                  <span className="text-sm text-zinc-300">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Detalles adicionales (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema..."
              rows={3}
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar Reporte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
