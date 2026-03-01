'use client'

import { useState } from 'react'
import { Ban, FileText, AlertTriangle, Shield, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Log {
  id: string
  admin_id: string
  action_type: string
  target_id: string
  target_type: string
  details: any
  created_at: string
  admin?: {
    username: string
  }
}

interface LogsClientProps {
  initialLogs: Log[]
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [logs] = useState<Log[]>(initialLogs)

  const getIcon = (type: string) => {
    switch (type) {
      case 'ban_user': return <Ban className="w-4 h-4 text-red-500" />
      case 'approve_post': return <FileText className="w-4 h-4 text-green-500" />
      case 'reject_post': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <Shield className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Logs de Auditoría</h1>
        <p className="text-zinc-400">Registro de todas las acciones administrativas</p>
      </div>

      <div className="bg-[#18191c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-medium text-zinc-400">Acción</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Administrador</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Objetivo</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Detalles</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No hay registros de actividad.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getIcon(log.action_type)}
                        <span className="font-medium text-white capitalize">
                          {log.action_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {log.admin?.username || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                      {log.target_type}: {log.target_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}