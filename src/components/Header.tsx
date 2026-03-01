'use client'

import Link from 'next/link'
import { Search, Bell, User, LogOut, Settings, Menu } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useUIStore } from '@/lib/store'
import NotificationCenter from '@/components/NotificationCenter'

interface HeaderProps {
  user: SupabaseUser | null
}

export default function Header({ user }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  useScrollDirection() // Initialize scroll listener
  const { isHeaderVisible, toggleSidebar } = useUIStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className={`sticky top-0 z-30 h-16 bg-[#0f1012]/80 backdrop-blur-md border-b border-[#2d2e33] flex items-center px-4 lg:px-8 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Mobile Menu Trigger */}
      <button 
        className="lg:hidden p-2 text-gray-400 hover:text-white mr-4"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-500 group-focus-within:text-[#2BD45A] transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Buscar ofertas, tiendas, marcas..."
          className="w-full bg-[#18191c] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]/50 focus:ring-1 focus:ring-[#2BD45A]/50 transition-all placeholder:text-gray-600 text-sm"
        />
        <div className="absolute right-3 top-2.5 hidden sm:flex items-center gap-1 pointer-events-none">
          <span className="text-[10px] text-gray-600 border border-[#2d2e33] rounded px-1.5 py-0.5 bg-[#222327]">Ctrl + K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {user && <NotificationCenter />}
        
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-[#18191c] transition-colors border border-transparent hover:border-[#2d2e33]"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white leading-none mb-1">
                  {user.user_metadata?.username || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-[#2BD45A]">Miembro Pro</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2BD45A] to-[#25b84e] flex items-center justify-center text-black font-bold shadow-lg shadow-[#2BD45A]/20">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  (user.user_metadata?.username?.[0] || user.email?.[0] || 'U').toUpperCase()
                )}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#18191c] border border-[#2d2e33] rounded-xl shadow-2xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-[#2d2e33] sm:hidden">
                  <p className="text-sm font-medium text-white">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <div className="p-1">
                  <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors">
                    <User size={16} /> Mi Perfil
                  </Link>
                  <Link href="/ajustes" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors">
                    <Settings size={16} /> Configuración
                  </Link>
                </div>
                
                <div className="border-t border-[#2d2e33] p-1 mt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                  >
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link 
            href="/auth/login" 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(43,212,90,0.3)] hover:shadow-[0_0_20px_rgba(43,212,90,0.5)]"
          >
            <User size={18} />
            <span className="hidden sm:inline">Acceder</span>
          </Link>
        )}
      </div>
    </header>
  )
}
