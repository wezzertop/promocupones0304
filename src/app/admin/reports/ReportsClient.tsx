'use client'

import { useState, useEffect } from 'react'
import { Flag, Loader2, CheckCircle, XCircle, ExternalLink, MessageSquare, Trash2, UserX } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { resolveReport, deleteContent, banAuthor } from './actions'

interface Report {
  id: string
  reporter_id: string
  target_id: string
  target_type: 'deal' | 'comment'
  reason: string
  description: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  reporter?: {
    username: string
  }
}

interface ReportsClientProps {
  initialReports: Report[]
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)

  useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    // Optimistic update
    setReports(prev => prev.filter(r => r.id !== id))
    try {
      await resolveReport(id, status)
    } catch (error) {
      alert('Error al actualizar reporte: ' + (error as Error).message)
      // Revert if error? For now just alert
    }
  }

  const handleDeleteContent = async (report: Report) => {
    if (!confirm('¿Eliminar permanentemente este contenido?')) return

    // Optimistic update
    setReports(prev => prev.filter(r => r.id !== report.id))
    try {
      await deleteContent(report.id, report.target_id, report.target_type)
    } catch (error) {
      alert('Error al eliminar contenido: ' + (error as Error).message)
    }
  }

  const handleBanAuthor = async (report: Report) => {
    if (!confirm('¿Estás seguro de banear al autor de este contenido?')) return

    // Optimistic update
    setReports(prev => prev.filter(r => r.id !== report.id))
    try {
      await banAuthor(report.id, report.target_id, report.target_type, report.reason)
      alert('Usuario baneado exitosamente.')
    } catch (error) {
      alert('Error al banear usuario: ' + (error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reportes de Usuarios</h1>
        <p className="text-zinc-400">Gestiona las denuncias enviadas por la comunidad</p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-[#18191c] rounded-2xl border border-white/5">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">¡Todo limpio!</h3>
            <p className="text-zinc-500">No hay reportes pendientes de revisión.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-[#18191c] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      report.target_type === 'deal' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {report.target_type === 'deal' ? 'Oferta' : 'Comentario'}
                    </span>
                    <span className="text-zinc-500 text-sm">•</span>
                    <span className="text-red-400 font-medium text-sm">
                      {report.reason}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>

                <p className="text-zinc-300 text-sm mb-4">
                  {report.description || "Sin descripción adicional."}
                </p>

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>Reportado por: <span className="text-white">{report.reporter?.username || 'Anónimo'}</span></span>
                  
                  {report.target_type === 'deal' ? (
                    <Link href={`/oferta/${report.target_id}`} target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline">
                      Ver Oferta <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> ID: {report.target_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <button 
                  onClick={() => handleResolve(report.id, 'resolved')}
                  className="flex-1 md:w-32 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  title="Marcar como resuelto sin acciones"
                >
                  <CheckCircle size={16} /> Resolver
                </button>
                <button 
                  onClick={() => handleDeleteContent(report)}
                  className="flex-1 md:w-32 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  title="Eliminar contenido y resolver"
                >
                  <Trash2 size={16} /> Eliminar
                </button>
                <button 
                  onClick={() => handleBanAuthor(report)}
                  className="flex-1 md:w-32 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  title="Banear usuario y resolver"
                >
                  <UserX size={16} /> Banear
                </button>
                <button 
                  onClick={() => handleResolve(report.id, 'dismissed')}
                  className="flex-1 md:w-32 bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Descartar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}