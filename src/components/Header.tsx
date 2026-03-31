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
import { ThemeToggle } from '@/components/ThemeToggle'
import Logo from '@/components/Logo'
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  useScrollDirection()
  const { isHeaderVisible, toggleSidebar } = useUIStore()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/'
  const currentFilter = searchParams?.get('filter') || 'foryou'

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('filter', filter)
    router.push(`/?${params.toString()}`)
  }

  // Ctrl+K opens search / Escape closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchExpanded(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setIsSearchExpanded(false)
        setIsSearchSuggestionsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        if (!searchQuery) setIsSearchExpanded(false)
        setIsSearchSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchQuery])

  const handleSearchExpand = () => {
    setIsSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchSuggestionsOpen(false)
      setIsSearchExpanded(false)
    }
  }

  const handleSelectSuggestion = (query: string) => {
    setSearchQuery(query)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setIsSearchSuggestionsOpen(false)
    setIsSearchExpanded(false)
  }

  useEffect(() => {
    async function fetchLevel() {
      if (!user) {
        setUserLevel(null)
        setIsAdminOrMod(false)
        return
      }
      const { data: levelData } = await supabase
        .from('gamification_profiles')
        .select('current_level')
        .eq('user_id', user.id)
        .single()
      if (levelData) setUserLevel((levelData as any).current_level)

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
    <header className={`fixed lg:sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-md border-b border-border transition-transform duration-300 w-full ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>

      {/* ── DESKTOP LAYOUT (sm+) ── */}
      <div className="hidden sm:flex items-center h-full px-3 md:px-5 gap-2">

        {/* LEFT: menu button + logo (big, clean) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="p-2 text-gray-400 hover:text-foreground transition-colors rounded-lg hover:bg-surface"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>

          <Link href="/" aria-label="CupOferta – Inicio" className="flex items-center">
            <Logo className="h-9 w-auto" />
          </Link>
        </div>

        {/* SPACER */}
        <div className="flex-1" />

        {/* EXPANDABLE SEARCH — icon collapses to full input */}
        <div
          ref={searchContainerRef}
          style={{ width: isSearchExpanded ? '360px' : '40px' }}
          className="relative flex items-center transition-all duration-300 ease-in-out overflow-visible"
        >
          {/* Icon button (collapsed) */}
          <button
            onClick={handleSearchExpand}
            aria-label="Buscar"
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-gray-400 hover:text-[#07B5A7] hover:border-[#07B5A7]/50 transition-all duration-200 ${
              isSearchExpanded ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
            }`}
          >
            <Search size={18} />
          </button>

          {/* Expanded input */}
          <div
            className={`w-full transition-all duration-300 ${
              isSearchExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-[#07B5A7]" />
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
                placeholder="Buscar ofertas, cupones..."
                autoComplete="off"
                className="w-full bg-surface text-foreground pl-9 pr-14 py-2 rounded-xl border border-[#07B5A7]/50 ring-1 ring-[#07B5A7]/25 focus:outline-none placeholder:text-gray-500 text-sm shadow-[0_0_16px_rgba(7,181,167,0.15)]"
              />
              <div className="absolute right-3 top-2 flex items-center pointer-events-none">
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-hover px-1.5 font-mono text-[10px] font-medium text-gray-500">
                  <span className="text-xs">Esc</span>
                </kbd>
              </div>
              <SearchSuggestions
                query={searchQuery}
                isOpen={isSearchSuggestionsOpen}
                onClose={() => {
                  setIsSearchSuggestionsOpen(false)
                  if (!searchQuery) setIsSearchExpanded(false)
                }}
                onSelect={handleSelectSuggestion}
              />
            </form>
          </div>
        </div>

        {/* RIGHT: actions */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <ThemeToggle />

          {isAdminOrMod && (
            <Link
              href="/admin/moderation"
              className="flex items-center gap-2 px-3 py-2 bg-surface-hover/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-foreground rounded-lg transition-colors border border-border"
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
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-surface transition-colors border border-transparent hover:border-border"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground leading-none mb-0.5">
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#07B5A7] to-[#25b84e] flex items-center justify-center text-black font-bold shadow-lg shadow-[#07B5A7]/20 overflow-hidden relative border-2 border-[#07B5A7]/30">
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
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#07B5A7] rounded-full border-2 border-surface animate-pulse z-10 shadow-[0_0_8px_#07B5A7] transform translate-x-1/4 -translate-y-1/4" />
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
                    {isAdminOrMod && (
                      <Link
                        href="/admin/moderation"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-yellow-500 hover:bg-surface-hover hover:text-yellow-400 rounded-lg transition-colors mb-1"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield size={16} /> Moderación
                      </Link>
                    )}
                    <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-surface-hover rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <UserIcon size={16} /> Mi Perfil
                    </Link>
                    <Link href="/perfil/alertas" className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-surface-hover rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <Bell size={16} /> Mis Alertas
                    </Link>
                    <Link href="/ajustes" className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-surface-hover rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <Settings size={16} /> Configuración
                    </Link>
                  </div>
                  <div className="border-t border-border p-1 mt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
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
              <span>Acceder</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT (< sm) ── */}
      <div className="flex sm:hidden items-center h-full px-2 gap-1">
        <button
          className="shrink-0 p-2 text-gray-400 hover:text-foreground transition-colors"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div className="z-50 relative pointer-events-auto">
          <ThemeToggle />
        </div>

        {isHome ? (
          <div className="flex-1 flex flex-row items-center justify-center gap-1 px-1 opacity-90">
            <button onClick={() => handleFilterChange('foryou')} className={`flex flex-1 items-center justify-center gap-1 px-1.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all whitespace-nowrap ${currentFilter === 'foryou' ? 'bg-surface-hover text-foreground shadow-md' : 'text-gray-400'}`}>
              <Sparkles size={12} className={`shrink-0 ${currentFilter === 'foryou' ? 'text-[#07B5A7]' : ''}`} />
              <span className="truncate">Para ti</span>
            </button>
            <button onClick={() => handleFilterChange('popular')} className={`flex flex-1 items-center justify-center gap-1 px-1.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all whitespace-nowrap ${currentFilter === 'popular' ? 'bg-surface-hover text-foreground shadow-md' : 'text-gray-400'}`}>
              <Flame size={12} className={`shrink-0 ${currentFilter === 'popular' ? 'text-orange-500' : ''}`} />
              <span className="truncate">Más votadas</span>
            </button>
            <button onClick={() => handleFilterChange('recent')} className={`flex flex-1 items-center justify-center gap-1 px-1.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all whitespace-nowrap ${currentFilter === 'recent' ? 'bg-surface-hover text-foreground shadow-md' : 'text-gray-400'}`}>
              <Clock size={12} className={`shrink-0 ${currentFilter === 'recent' ? 'text-blue-500' : ''}`} />
              <span className="truncate">Recientes</span>
            </button>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex justify-end items-center gap-1 shrink-0">
          {user && <SearchAlertButton initialKeyword={searchQuery} userId={user.id} />}
        </div>
      </div>

    </header>
  )
}
