'use client'

import { useState } from 'react'
import { Search, Ban, CheckCircle, Shield, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { banUser, unbanUser } from './actions'

interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'verified' | 'moderator' | 'admin'
  karma_points: number
  created_at: string
  is_banned: boolean
  ban_reason?: string
}

interface UsersClientProps {
  initialUsers: User[]
  currentUserRole: string
  searchQuery?: string
}

export default function UsersClient({ initialUsers, currentUserRole, searchQuery }: UsersClientProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery || '')
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const params = new URLSearchParams()
    if (searchTerm) {
      params.set('q', searchTerm)
    }
    router.push(`/admin/users?${params.toString()}`)
    setLoading(false)
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return

    try {
      await banUser(selectedUser.id, banReason)
      setBanModalOpen(false)
      setBanReason('')
      setSelectedUser(null)
      alert('Usuario baneado correctamente')
    } catch (error) {
      alert('Error al banear usuario: ' + (error as Error).message)
    }
  }

  const handleUnbanUser = async (user: User) => {
    if (!confirm(`¿Estás seguro de desbanear a ${user.username}?`)) return

    try {
      await unbanUser(user.id)
      alert('Usuario desbaneado correctamente')
    } catch (error) {
      alert('Error al desbanear usuario: ' + (error as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-zinc-400">Administra roles y permisos de la comunidad</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#18191c] border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
          />
        </form>
      </div>

      <div className="bg-[#18191c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-medium text-zinc-400">Usuario</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Rol</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Puntos</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Estado</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Registro</th>
                <th className="px-6 py-4 font-medium text-zinc-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                    </div>
                  </td>
                </tr>
              ) : initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.username}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        user.role === 'moderator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        user.role === 'verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-mono">
                      {user.karma_points}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs">
                          <Ban className="w-3 h-3" /> Baneado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.is_banned ? (
                        <button 
                          onClick={() => handleUnbanUser(user)}
                          className="text-green-500 hover:bg-green-500/10 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          disabled={currentUserRole !== 'admin'}
                        >
                          Desbanear
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedUser(user)
                            setBanModalOpen(true)
                          }}
                          className="text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          disabled={user.role === 'admin' || currentUserRole !== 'admin'}
                        >
                          Banear
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18191c] rounded-2xl border border-white/10 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Banear Usuario</h3>
            <p className="text-zinc-400 text-sm mb-4">
              ¿Estás seguro de que quieres suspender a <span className="text-white font-bold">{selectedUser?.username}</span>?
              Esta acción impedirá que el usuario inicie sesión.
            </p>
            
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Razón del baneo..."
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBanModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleBanUser}
                disabled={!banReason}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Baneo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}