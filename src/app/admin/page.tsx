import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { FileText, Users, AlertTriangle, CheckCircle } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get metrics
  const { count: pendingCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: activeCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: reportsCount } = await supabase
    .from('moderation_logs')
    .select('*', { count: 'exact', head: true })
    // In a real scenario, we might have a reports table, but for now let's use logs or just 0
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
        <p className="text-zinc-400">Visión general del estado del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#18191c] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Pendientes</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{pendingCount || 0}</div>
          <p className="text-sm text-zinc-500">Publicaciones por revisar</p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Activas</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{activeCount || 0}</div>
          <p className="text-sm text-zinc-500">Ofertas publicadas</p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Usuarios</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{usersCount || 0}</div>
          <p className="text-sm text-zinc-500">Total registrados</p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Logs</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{reportsCount || 0}</div>
          <p className="text-sm text-zinc-500">Acciones registradas</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#18191c] p-6 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
        <p className="text-zinc-500 text-sm">
          Consulta el módulo de Logs de Auditoría para ver el detalle completo.
        </p>
      </div>
    </div>
  )
}
