'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Tag, Store, Flame, ArrowUpRight, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  title: string
  type: 'deal' | 'store' | 'category'
  href: string
  image_url?: string
  metadata?: any
}

interface SearchSuggestionsProps {
  query: string
  isOpen: boolean
  onClose: () => void
  onSelect: (query: string) => void
}

export default function SearchSuggestions({ query, isOpen, onClose, onSelect }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const supabase = createClient()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        // 1. Search Deals
        const { data: deals } = await supabase
          .from('deals')
          .select('id, title, votes_count, image_urls')
          .ilike('title', `%${query}%`)
          .eq('status', 'active')
          .limit(5)

        // 2. Search Stores
        const { data: stores } = await supabase
          .from('stores')
          .select('id, name, slug')
          .ilike('name', `%${query}%`)
          .limit(3)

        // 3. Search Categories
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .ilike('name', `%${query}%`)
          .limit(3)

        const formattedSuggestions: Suggestion[] = [
          ...(deals?.map(d => ({
            id: d.id,
            title: d.title,
            type: 'deal' as const,
            href: `/oferta/${d.id}`,
            image_url: d.image_urls?.[0],
            metadata: { hot: d.votes_count > 50 }
          })) || []),
          ...(stores?.map(s => ({
            id: s.id,
            title: s.name,
            type: 'store' as const,
            href: `/search?q=${encodeURIComponent(s.name)}`
          })) || []),
          ...(categories?.map(c => ({
            id: c.id,
            title: c.name,
            type: 'category' as const,
            href: `/categoria/${c.slug}`
          })) || [])
        ]

        setSuggestions(formattedSuggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [query, supabase])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev))
      } else if (e.key === 'Enter' && selectedIndex !== -1) {
        e.preventDefault()
        const selected = suggestions[selectedIndex]
        if (selected) {
          router.push(selected.href)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, suggestions, selectedIndex, router, onClose])

  if (!isOpen || (!query && suggestions.length === 0)) return null

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="max-h-[min(80vh,480px)] overflow-y-auto scrollbar-hide">
        {loading && suggestions.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader2 className="animate-spin text-[#07B5A7]" size={24} />
            <p className="text-sm">Buscando...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="py-2">
            {suggestions.map((suggestion, index) => {
              const isActive = selectedIndex === index
              return (
                <Link
                  key={`${suggestion.type}-${suggestion.id}`}
                  href={suggestion.href}
                  onClick={() => onClose()}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors group",
                    isActive ? "bg-[#07B5A7]/10" : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors relative overflow-hidden",
                    isActive ? "bg-[#07B5A7] text-black" : "bg-surface-hover text-gray-500 group-hover:text-foreground"
                  )}>
                    {suggestion.image_url ? (
                      <Image 
                        src={suggestion.image_url} 
                        alt={suggestion.title} 
                        fill 
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        {suggestion.type === 'deal' && (suggestion.metadata?.hot ? <Flame size={18} /> : <Search size={18} />)}
                        {suggestion.type === 'store' && <Store size={18} />}
                        {suggestion.type === 'category' && <Tag size={18} />}
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-[#07B5A7]" : "text-gray-200"
                    )}>
                      {suggestion.title}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      {suggestion.type === 'deal' ? 'Oferta' : suggestion.type === 'store' ? 'Tienda' : 'Categoría'}
                    </p>
                  </div>

                  <ArrowUpRight 
                    size={14} 
                    className={cn(
                      "text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                      isActive && "text-[#07B5A7]"
                    )} 
                  />
                </Link>
              )
            })}
            
            <div className="mt-2 p-2 border-t border-border">
              <button
                onClick={() => onSelect(query)}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-500 hover:text-foreground transition-colors"
              >
                <Search size={14} />
                VER TODOS LOS RESULTADOS PARA "{query.toUpperCase()}"
              </button>
            </div>
          </div>
        ) : query.length >= 2 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No se encontraron sugerencias para "{query}"</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Búsquedas sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {['iPhone', 'Laptop', 'Zapatillas', 'Amazon', 'Gaming'].map(term => (
                <button
                  key={term}
                  onClick={() => onSelect(term)}
                  className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-sm text-gray-300 hover:text-[#07B5A7] hover:border-[#07B5A7]/50 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
