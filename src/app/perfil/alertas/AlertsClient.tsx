'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, AlertCircle, BellOff, Edit2, LayoutGrid, List, Plus } from 'lucide-react'
import CreateAlertModal, { Alert } from '@/components/CreateAlertModal'

interface AlertsClientProps {
  initialAlerts: Alert[]
  userId: string
}

export default function AlertsClient({ initialAlerts, userId }: AlertsClientProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta alerta?')) return

    try {
      await supabase.from('deal_alerts').delete().eq('id', id)
      setAlerts(alerts.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting alert', error)
      alert('Error al eliminar la alerta')
    }
  }

  const handleOpenEdit = (alert: Alert) => {
    setEditingAlert(alert)
    setIsModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingAlert(null)
    setIsModalOpen(true)
  }

  const handleModalSuccess = (savedAlert: Alert) => {
    if (editingAlert) {
      setAlerts(alerts.map(a => a.id === savedAlert.id ? savedAlert : a))
    } else {
      setAlerts([savedAlert, ...alerts])
    }
  }

  const renderToolbar = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <button 
        onClick={handleOpenCreate}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(7,181,167,0.3)] hover:shadow-[0_0_20px_rgba(7,181,167,0.5)]"
      >
        <Plus size={18} /> Crear Alerta
      </button>

      {alerts.length > 0 && (
        <div className="flex items-center bg-surface border border-border rounded-xl p-1 w-full sm:w-auto justify-center">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center ${viewMode === 'grid' ? 'bg-surface-hover text-foreground shadow-sm' : 'text-zinc-500 hover:text-foreground'}`}
            title="Vista de Cuadrícula"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center ${viewMode === 'list' ? 'bg-surface-hover text-foreground shadow-sm' : 'text-zinc-500 hover:text-foreground'}`}
            title="Vista de Lista"
          >
            <List size={18} />
          </button>
        </div>
      )}
    </div>
  )

  if (alerts.length === 0) {
    return (
      <div className="space-y-6">
        {renderToolbar()}
        <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
            <BellOff size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No tienes alertas activas</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
            Puedes crear una alerta nueva aquí o desde la página de búsqueda. Te avisaremos cuando haya ofertas que coincidan con lo que buscas.
          </p>
          <button 
            onClick={handleOpenCreate}
            className="px-6 py-3 bg-surface-hover hover:bg-black/5 dark:hover:bg-[#2d2e33] text-foreground font-medium rounded-xl border border-border transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Crear mi primera alerta
          </button>
        </div>

        <CreateAlertModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={userId}
          alertToEdit={editingAlert}
          onSuccess={handleModalSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderToolbar()}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-[#07B5A7]/30 transition-colors shadow-sm group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-[#07B5A7]/10 text-[#07B5A7] text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#07B5A7] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#07B5A7]"></span>
                    </span>
                    Activa
                  </span>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(alert)}
                      className="text-zinc-500 hover:text-foreground p-2 rounded-full hover:bg-surface-hover transition-colors"
                      title="Editar Alerta"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(alert.id)}
                      className="text-zinc-500 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                      title="Eliminar Alerta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1 truncate" title={alert.keyword}>
                  {alert.keyword}
                </h3>
                {alert.max_price ? (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Precio máximo: <span className="text-[#07B5A7] font-medium">${alert.max_price}</span>
                  </p>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Sin límite de precio</p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Buscando coincidencias...
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#07B5A7]/30 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-[#07B5A7]/10 items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#07B5A7] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#07B5A7]"></span>
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate" title={alert.keyword}>
                    {alert.keyword}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {alert.max_price ? (
                      <span>Máx: <strong className="text-[#07B5A7]">${alert.max_price}</strong></span>
                    ) : (
                      <span>Sin límite</span>
                    )}
                    <span className="hidden sm:inline text-zinc-600">•</span>
                    <span className="hidden sm:flex items-center gap-1.5 text-xs">
                      <AlertCircle size={12} /> Buscando coincidencias
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 justify-end shrink-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(alert)}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <Edit2 size={14} /> 
                  <span className="sm:hidden">Editar</span>
                </button>
                <button 
                  onClick={() => handleDelete(alert.id)}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  <span className="sm:hidden">Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAlertModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        alertToEdit={editingAlert}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
