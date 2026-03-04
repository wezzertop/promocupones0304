'use client'

import { useState } from 'react'
import { searchDeals, publishDeal } from './actions'
import { ScrapedDeal } from '@/lib/scraper'
import { Search, ShoppingCart, Loader2, Upload, ExternalLink, AlertTriangle, CheckCircle, Tag } from 'lucide-react'
import Image from 'next/image'
import { Category } from '@/types'

interface ScraperClientProps {
  categories: Category[]
}

export default function ScraperClient({ categories }: ScraperClientProps) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'mercadolibre' | 'amazon'>('mercadolibre')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScrapedDeal[]>([])
  const [publishing, setPublishing] = useState<string | null>(null)
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setResults([])
    try {
      const deals = await searchDeals(query, source)
      setResults(deals)
    } catch (error) {
      console.error(error)
      alert('Error al buscar ofertas')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (deal: ScrapedDeal) => {
    if (!selectedCategory) {
      alert('Selecciona una categoría para publicar')
      return
    }

    setPublishing(deal.id)
    try {
      const res = await publishDeal(deal, selectedCategory)
      if (res.error) {
        alert(res.error)
      } else {
        setPublishedIds(prev => new Set(prev).add(deal.id))
      }
    } catch (error) {
      console.error(error)
      alert('Error al publicar')
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="text-[#2BD45A]" size={32} />
            Scraper de Ofertas
          </h1>
          <p className="text-gray-400">Busca y publica ofertas automáticamente desde Mercado Libre y Amazon.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: iPhone 15, Laptop Gamer, Audífonos Sony..."
              className="w-full bg-[#222327] text-white pl-10 pr-4 py-3 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]"
            />
          </div>
          
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
            className="bg-[#222327] text-white px-4 py-3 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]"
          >
            <option value="mercadolibre">Mercado Libre</option>
            <option value="amazon">Amazon (Beta)</option>
          </select>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-[#2BD45A] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#25b84e] transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            Buscar
          </button>
        </form>
      </div>

      {/* Category Selection for Publishing */}
      <div className="flex items-center gap-4 bg-[#18191c] p-4 rounded-xl border border-[#2d2e33]">
        <Tag className="text-[#2BD45A]" size={20} />
        <span className="text-gray-300 font-medium">Publicar en categoría:</span>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#222327] text-white px-4 py-2 rounded-lg border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A] flex-1 max-w-xs"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((deal) => (
            <div key={deal.id} className="bg-[#18191c] border border-[#2d2e33] rounded-2xl overflow-hidden flex flex-col group hover:border-[#2BD45A]/50 transition-colors">
              <div className="relative aspect-square bg-white p-4">
                <Image
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-contain"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                  {deal.source === 'mercadolibre' ? 'MELI' : 'AMZN'}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 min-h-[2.5rem]" title={deal.title}>
                  {deal.title}
                </h3>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-xl font-bold text-[#2BD45A]">
                      ${deal.price.toLocaleString()}
                    </span>
                    {deal.original_price && (
                      <span className="text-sm text-gray-500 line-through mb-1">
                        ${deal.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={deal.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#222327] hover:bg-[#2d2e33] text-gray-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Ver
                    </a>
                    
                    {publishedIds.has(deal.id) ? (
                      <button 
                        disabled 
                        className="flex-1 bg-green-500/20 text-green-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-default border border-green-500/20"
                      >
                        <CheckCircle size={14} />
                        Publicado
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(deal)}
                        disabled={publishing === deal.id}
                        className="flex-1 bg-[#2BD45A] hover:bg-[#25b84e] text-black py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {publishing === deal.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Upload size={14} />
                            Publicar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && query && (
          <div className="text-center py-20 bg-[#18191c] rounded-2xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin resultados</h3>
            <p className="text-gray-400">Intenta con otros términos de búsqueda.</p>
          </div>
        )
      )}
    </div>
  )
}
