'use client'

import Link from 'next/link'
import { Home, Search, Plus, User as UserIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import NotificationCenter from '@/components/NotificationCenter'
import SearchSuggestions from '@/components/SearchSuggestions'
import { ChevronLeft, Search as SearchIcon } from 'lucide-react'

interface MobileBottomNavProps {
  user: SupabaseUser | null
}

export default function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Hide the bar completely if we are in admin
  if (pathname?.startsWith('/admin')) return null

  // Helpers to determine active state
  const isHome = pathname === '/'
  const isSearch = pathname?.startsWith('/search') || isSearchOpen
  const isProfile = pathname?.startsWith('/perfil') || pathname?.startsWith('/ajustes')
  
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const handleSelectSuggestion = (query: string) => {
    setSearchQuery(query)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setIsSearchOpen(false)
  }

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path === '/search') {
      e.preventDefault()
      setIsSearchOpen(true)
    }
  }

  return (
    <>
    {isSearchOpen && (
      <div className="md:hidden fixed inset-0 z-[200] bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 p-3 border-b border-border bg-surface">
          <button onClick={() => setIsSearchOpen(false)} className="p-2 text-zinc-400 hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ofertas, tiendas..."
              className="w-full bg-background text-foreground pl-9 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-[#07B5A7]/50"
            />
          </form>
        </div>
        <div className="flex-1 overflow-y-auto relative bg-background">
          <SearchSuggestions 
            query={searchQuery}
            isOpen={true}
            onClose={() => setIsSearchOpen(false)}
            onSelect={handleSelectSuggestion}
          />
        </div>
      </div>
    )}

    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/90 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 px-2 relative">
        
        {/* Inicio */}
        <Link 
          href="/" 
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors",
            isHome ? "text-[#07B5A7]" : "text-zinc-500 hover:text-foreground"
          )}
        >
          <Home size={22} className={cn(isHome ? "stroke-[2.5px]" : "stroke-[2px]")} />
          <span className="text-[9px] font-bold tracking-wide">Inicio</span>
        </Link>
        
        {/* Buscar */}
        <Link 
          href="/search" 
          onClick={(e) => handleNavigate(e, '/search')}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors",
            isSearch ? "text-[#07B5A7]" : "text-zinc-500 hover:text-foreground"
          )}
        >
          <Search size={22} className={cn(isSearch ? "stroke-[2.5px]" : "stroke-[2px]")} />
          <span className="text-[9px] font-bold tracking-wide">Buscar</span>
        </Link>

        {/* Publish FAB (Floating over tab bar) */}
        <div className="relative w-14 h-full flex items-center justify-center -mt-6">
          <Link 
            href="/publicar"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#07B5A7] to-[#25b84e] shadow-[0_0_20px_rgba(7,181,167,0.4)] active:scale-95 transition-transform"
          >
            <Plus size={28} color="black" strokeWidth={3} />
          </Link>
        </div>

        {/* Alertas */}
        <div className={cn("flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors", !user && "opacity-50 pointer-events-none")}>
            <NotificationCenter isMobile={true} />
            <span className="text-[9px] font-bold tracking-wide text-zinc-500">Alertas</span>
        </div>

        {/* Acceder / Perfil */}
        <Link 
          href={user ? "/perfil" : "/auth/login"} 
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors",
            isProfile ? "text-[#07B5A7]" : "text-zinc-500 hover:text-foreground"
          )}
        >
          {user ? (
            <div className={cn(
              "w-6 h-6 rounded-full overflow-hidden border-[1.5px]",
              isProfile ? "border-[#07B5A7]" : "border-zinc-500"
            )}>
              {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                <Image 
                  src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                  alt="Perfil" 
                  width={24} height={24}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-foreground font-bold">
                  {(user.user_metadata?.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
          ) : (
             <UserIcon size={22} className={cn(isProfile ? "stroke-[2.5px]" : "stroke-[2px]")} />
          )}
          <span className="text-[9px] font-bold tracking-wide">
             {user ? "Perfil" : "Acceder"}
          </span>
        </Link>
        
      </div>
    </nav>
    </>
  )
}
