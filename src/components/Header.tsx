'use client'

import Link from 'next/link'
import { Search, Bell, User as UserIcon, LogOut, Settings, Menu, BadgeCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useUIStore } from '@/lib/store'
import NotificationCenter from '@/components/NotificationCenter'

import Image from 'next/image'

interface HeaderProps {
  user: SupabaseUser | null
}

export default function Header({ user }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userLevel, setUserLevel] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()
  useScrollDirection() // Initialize scroll listener
  const { isHeaderVisible, toggleSidebar } = useUIStore()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  useEffect(() => {
    async function fetchLevel() {
      if (!user) return
      
      const { data } = await supabase
        .from('gamification_profiles')
        .select('current_level')
        .eq('user_id', user.id)
        .single()
        
      if (data) {
        const levelData = data as any
        setUserLevel(levelData.current_level)
      }
    }
    
    fetchLevel()
  }, [user, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className={`sticky top-0 z-30 h-16 bg-[#0f1012]/80 backdrop-blur-md border-b border-[#2d2e33] flex items-center px-4 lg:px-8 transition-transform duration-300 w-full ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Mobile Menu Trigger */}
      <button 
        className="lg:hidden p-2 text-gray-400 hover:text-white mr-2 shrink-0"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <form onSubmit={(e) => {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const input = form.querySelector('input') as HTMLInputElement
          if (input.value.trim()) {
            router.push(`/search?q=${encodeURIComponent(input.value.trim())}`)
          }
        }} className="w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-[#2BD45A] transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            name="q"
            placeholder="Buscar..."
            className="w-full bg-[#18191c] text-white pl-9 pr-2 py-2.5 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]/50 focus:ring-1 focus:ring-[#2BD45A]/50 transition-all placeholder:text-gray-600 text-sm"
          />
          <div className="absolute right-3 top-2.5 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-[#2d2e33] bg-[#222327] px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
              <span className="text-xs">Ctrl</span> K
            </kbd>
          </div>
        </form>
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
                <div className="flex items-center justify-end gap-1">
                  <p className="text-xs text-[#2BD45A]">
                    {userLevel ? `Nivel ${userLevel}` : 'Miembro Pro'}
                  </p>
                  {userLevel && userLevel >= 50 && (
                    <BadgeCheck size={14} className="text-blue-400" fill="currentColor" stroke="black" />
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2BD45A] to-[#25b84e] flex items-center justify-center text-black font-bold shadow-lg shadow-[#2BD45A]/20 overflow-hidden relative border-2 border-[#2BD45A]/30 group">
                {user.user_metadata?.avatar_url ? (
                  <Image 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    fill
                    sizes="36px"
                    className="object-cover rounded-full"
                  />
                ) : (
                  (user.user_metadata?.username?.[0] || user.email?.[0] || 'U').toUpperCase()
                )}
                {/* Online Status Indicator (Pulse) */}
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#2BD45A] rounded-full border-2 border-[#18191c] animate-pulse z-10 shadow-[0_0_8px_#2BD45A] transform translate-x-1/4 -translate-y-1/4"></div>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#18191c] border border-[#2d2e33] rounded-xl shadow-2xl py-1 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-[#2d2e33] sm:hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <div className="p-1">
                  <Link 
                    href="/perfil" 
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserIcon size={16} /> Mi Perfil
                  </Link>
                  <Link 
                    href="/ajustes" 
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
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
            <UserIcon size={18} />
            <span className="hidden sm:inline">Acceder</span>
          </Link>
        )}
      </div>
    </header>
  )
}
