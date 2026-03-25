'use client'

import Link from 'next/link'
import { Search, Bell, User as UserIcon, LogOut, Settings, Menu, BadgeCheck, Shield, Sparkles, Flame, Clock } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useUIStore } from '@/lib/store'
import NotificationCenter from '@/components/NotificationCenter'
import SearchSuggestions from '@/components/SearchSuggestions'
import SearchAlertButton from '@/components/SearchAlertButton'

import Image from 'next/image'

interface HeaderProps {
  user: SupabaseUser | null
}

export default function Header({ user }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userLevel, setUserLevel] = useState<number | null>(null)
  const [isAdminOrMod, setIsAdminOrMod] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  useScrollDirection() // Initialize scroll listener
  const { isHeaderVisible, toggleSidebar } = useUIStore()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isHome = pathname === '/'
  const currentFilter = searchParams?.get('filter') || 'foryou'

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('filter', filter)
    router.push(`/?${params.toString()}`)
  }
  
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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchSuggestionsOpen(false)
    }
  }

  const handleSelectSuggestion = (query: string) => {
    setSearchQuery(query)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setIsSearchSuggestionsOpen(false)
  }

  useEffect(() => {
    async function fetchLevel() {
      if (!user) {
        setUserLevel(null)
        setIsAdminOrMod(false)
        return
      }
      
      // Fetch level
      const { data: levelData } = await supabase
        .from('gamification_profiles')
        .select('current_level')
        .eq('user_id', user.id)
        .single()
        
      if (levelData) {
        const data = levelData as any
        setUserLevel(data.current_level)
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleData) {
        const role = (roleData as any).role
        setIsAdminOrMod(role === 'admin' || role === 'moderator')
      }
    }
    
    fetchLevel()
  }, [user, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className={`fixed lg:sticky top-0 z-40 h-14 bg-[#161616]/80 backdrop-blur-md border-b border-[#2d2e33] flex items-center px-2 md:px-4 transition-transform duration-300 w-full ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden shrink-0 mr-1 md:mr-2 w-10 h-10 flex items-center justify-center">
        <button 
          className="p-2 text-gray-400 hover:text-white"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Nav Filters (Home Only) */}
      {isHome && (
        <div className="sm:hidden flex-1 flex flex-row items-center gap-1.5 overflow-x-auto scrollbar-hide px-1 justify-end opacity-90 pr-2">
          <button onClick={() => handleFilterChange('foryou')} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${currentFilter === 'foryou' ? 'bg-[#222327] text-white shadow-md' : 'text-gray-400'}`}>
            <Sparkles size={14} className={currentFilter === 'foryou' ? 'text-[#07B5A7]' : ''}/> Para ti
          </button>
          <button onClick={() => handleFilterChange('popular')} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${currentFilter === 'popular' ? 'bg-[#222327] text-white shadow-md' : 'text-gray-400'}`}>
            <Flame size={14} className={currentFilter === 'popular' ? 'text-orange-500' : ''}/> Más votadas
          </button>
          <button onClick={() => handleFilterChange('recent')} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${currentFilter === 'recent' ? 'bg-[#222327] text-white shadow-md' : 'text-gray-400'}`}>
            <Clock size={14} className={currentFilter === 'recent' ? 'text-blue-500' : ''}/> Recientes
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="hidden sm:block flex-1 w-full max-w-2xl relative group mx-1 md:mx-4 lg:mx-8">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-[#07B5A7] transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            name="q"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchSuggestionsOpen(true)
            }}
            onFocus={() => setIsSearchSuggestionsOpen(true)}
            placeholder="Buscar..."
            autoComplete="off"
            className="w-full bg-[#222222] text-white pl-9 pr-2 py-2.5 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#07B5A7]/50 focus:ring-1 focus:ring-[#07B5A7]/50 transition-[border-color,box-shadow] duration-200 placeholder:text-gray-600 text-sm relative z-0"
          />
          <div className="absolute right-3 top-2.5 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-[#2d2e33] bg-[#222327] px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
              <span className="text-xs">Ctrl</span> K
            </kbd>
          </div>

          <SearchSuggestions 
            query={searchQuery}
            isOpen={isSearchSuggestionsOpen}
            onClose={() => setIsSearchSuggestionsOpen(false)}
            onSelect={handleSelectSuggestion}
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="hidden sm:flex items-center gap-1 sm:gap-4 ml-auto w-[100px] sm:w-auto justify-end">
        {isAdminOrMod && (
          <Link 
            href="/admin/moderation" 
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
            title="Panel de Moderación"
          >
            <Shield size={18} />
          </Link>
        )}

        {user && <SearchAlertButton initialKeyword={searchQuery} userId={user.id} />}

        {user && <NotificationCenter />}
        
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-[#222222] transition-colors border border-transparent hover:border-[#2d2e33]"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white leading-none mb-1">
                  {user.user_metadata?.username || user.email?.split('@')[0]}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <p className="text-xs text-[#07B5A7]">
                    {userLevel ? `Nivel ${userLevel}` : 'Miembro Pro'}
                  </p>
                  {userLevel && userLevel >= 50 && (
                    <BadgeCheck size={14} className="text-blue-400" fill="currentColor" stroke="black" />
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#07B5A7] to-[#25b84e] flex items-center justify-center text-black font-bold shadow-lg shadow-[#07B5A7]/20 overflow-hidden relative border-2 border-[#07B5A7]/30 group">
                {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                  <Image 
                    src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                    alt="Avatar" 
                    fill
                    sizes="36px"
                    className="object-cover rounded-full"
                    unoptimized
                  />
                ) : (
                  (user.user_metadata?.username?.[0] || user.email?.[0] || 'U').toUpperCase()
                )}
                {/* Online Status Indicator (Pulse) */}
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#07B5A7] rounded-full border-2 border-[#222222] animate-pulse z-10 shadow-[0_0_8px_#07B5A7] transform translate-x-1/4 -translate-y-1/4"></div>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#222222] border border-[#2d2e33] rounded-xl shadow-2xl py-1 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-[#2d2e33] sm:hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <div className="p-1">
                  {isAdminOrMod && (
                    <Link 
                      href="/admin/moderation" 
                      className="flex items-center gap-3 px-3 py-2 text-sm text-yellow-500 hover:bg-[#222327] hover:text-yellow-400 rounded-lg transition-colors mb-1"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Shield size={16} /> Moderación
                    </Link>
                  )}
                  <Link 
                    href="/perfil" 
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserIcon size={16} /> Mi Perfil
                  </Link>
                  <Link 
                    href="/perfil/alertas" 
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#222327] hover:text-white rounded-lg transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Bell size={16} /> Mis Alertas
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
            className="flex items-center gap-2 px-5 py-2.5 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(7,181,167,0.3)] hover:shadow-[0_0_20px_rgba(7,181,167,0.5)]"
          >
            <UserIcon size={18} />
            <span className="hidden sm:inline">Acceder</span>
          </Link>
        )}
      </div>

      {/* Global Alert Button for Mobile */}
      <div className="sm:hidden">
        {user && <SearchAlertButton initialKeyword={searchQuery} userId={user.id} />}
      </div>
    </header>
  )
}
