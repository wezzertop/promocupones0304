'use client'

import { useState, useEffect } from 'react'
import { searchDeals, publishDeal, scrapeUrl, getScraperLogs } from './actions'
import { ScrapedDeal } from '@/lib/scraper'
import { Search, ShoppingCart, Loader2, Upload, ExternalLink, CheckCircle, Tag, Link as LinkIcon, FileText, RefreshCw, AlertCircle, Truck, Info, Eye } from 'lucide-react'
import Image from 'next/image'
import { Category } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import DealPreviewModal from './DealPreviewModal'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/utils'

interface ScraperClientProps {
  categories: Category[]
}

export default function ScraperClient({ categories }: ScraperClientProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'logs'>('search')
  const [query, setQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [source, setSource] = useState<'mercadolibre' | 'amazon'>('mercadolibre')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScrapedDeal[]>([])
  const [publishing, setPublishing] = useState<string | null>(null)
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '')
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'discount'>('price_asc')
  const [previewDeal, setPreviewDeal] = useState<ScrapedDeal | null>(null)
  const supabase = createClient()

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    if (sortBy === 'discount') {
        const discountA = a.original_price ? (a.original_price - a.price) / a.original_price : 0
        const discountB = b.original_price ? (b.original_price - b.price) / b.original_price : 0
        return discountB - discountA
    }
    return 0
  })

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

  const handleUrlScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setLoading(true)
    setResults([])
    
    // Auto-detect source based on URL
    let currentSource = source
    if (urlInput.includes('mercadolibre.com')) currentSource = 'mercadolibre'
    else if (urlInput.includes('amazon.com')) currentSource = 'amazon'
    setSource(currentSource)

    try {
      const res = await scrapeUrl(urlInput, currentSource)
      if (res.error || !res.deal) {
        alert(res.error || 'No se encontró la oferta')
      } else {
        const deal = res.deal
        setResults([deal])
        
        // Auto-select category if suggested
        if (deal.suggested_category) {
            // Simple fuzzy matching or direct matching logic
            const suggested = deal.suggested_category.toLowerCase()
            const match = categories.find(cat => 
                suggested.includes(cat.name.toLowerCase()) || 
                cat.name.toLowerCase().includes(suggested.split('>')[0].trim().toLowerCase())
            )
            if (match) {
                setSelectedCategory(match.id)
            }
        }
      }
    } catch (error) {
      console.error(error)
      alert('Error al extraer información de la URL')
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
      // 1. Descargar y Optimizar Imágenes
      let optimizedImageUrl = deal.image_url;
      let optimizedImageUrls: string[] = [];
      
      // Determine which images to process: prefer the gallery list if available, otherwise fallback to single image
      const sourceImages = deal.image_urls && deal.image_urls.length > 0 ? deal.image_urls : [deal.image_url];
      
      // Process images sequentially or in parallel? Parallel is faster but might hit rate limits. Let's try parallel.
      const uploadPromises = sourceImages.map(async (imgUrl) => {
          try {
            // Fetch via proxy to avoid CORS
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
              const blob = await response.blob();
              // Create file object for compressImage
              const file = new File([blob], 'image.jpg', { type: blob.type });
              
              // Optimizar (Resize + WebP)
              // Using 0.8 quality and 1200px max width
              const compressedBlob = await compressImage(file, 0.8, 1200, 'image/webp');
              
              // Upload to Supabase Storage
              // We need a unique filename
              const timestamp = Date.now();
              const randomString = Math.random().toString(36).substring(7);
              const fileName = `scraped/${timestamp}-${randomString}.webp`;
              
              const { data, error: uploadError } = await supabase.storage
                .from('deals')
                .upload(fileName, compressedBlob, {
                  contentType: 'image/webp',
                  upsert: false
                });
    
              if (uploadError) {
                 console.error('Error subiendo imagen optimizada:', uploadError);
                 return null; // Return null on error
              } else {
                 // Get Public URL
                 const { data: { publicUrl } } = supabase.storage
                  .from('deals')
                  .getPublicUrl(fileName);
                 
                 return publicUrl;
              }
            } else {
              console.warn('No se pudo descargar la imagen para optimizar via proxy:', imgUrl);
              return null;
            }
          } catch (imgError) {
            console.error('Error optimizando imagen:', imgError);
            return null;
          }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Filter out failed uploads
      const validUploadedUrls = uploadedUrls.filter((url): url is string => url !== null);
      
      if (validUploadedUrls.length > 0) {
          optimizedImageUrls = validUploadedUrls;
          optimizedImageUrl = validUploadedUrls[0]; // Set the first one as main image
      } else {
          // Fallback: If ALL optimizations failed, try to use original URLs? 
          // Or just fail gracefully? Let's use originals as fallback if optimization fails completely
          console.warn('Todas las optimizaciones fallaron, usando URLs originales');
          optimizedImageUrl = deal.image_url;
          optimizedImageUrls = deal.image_urls || [deal.image_url];
      }

      // 2. Publicar con las nuevas URLs
      const dealToPublish = {
        ...deal,
        image_url: optimizedImageUrl,
        image_urls: optimizedImageUrls
      };

      const res = await publishDeal(dealToPublish, selectedCategory)
      if (res.error) {
        alert(res.error)
      } else {
        setPublishedIds(prev => new Set(prev).add(deal.id))
        if (activeTab === 'logs') loadLogs()
      }
    } catch (error) {
      console.error(error)
      alert('Error al publicar')
    } finally {
      setPublishing(null)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const data = await getScraperLogs()
      setLogs(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="text-[#2BD45A]" size={32} />
            Scraper de Ofertas
          </h1>
          <p className="text-gray-400">Extrae y publica ofertas desde Mercado Libre y Amazon.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#2d2e33]">
        <button
          onClick={() => setActiveTab('search')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'search' ? 'text-[#2BD45A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search size={18} />
            Búsqueda
          </div>
          {activeTab === 'search' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2BD45A]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'url' ? 'text-[#2BD45A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <LinkIcon size={18} />
            Importar URL
          </div>
          {activeTab === 'url' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2BD45A]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'logs' ? 'text-[#2BD45A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={18} />
            Logs
          </div>
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2BD45A]" />
          )}
        </button>
      </div>

      {activeTab === 'logs' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Historial de Operaciones</h3>
            <button 
              onClick={loadLogs} 
              disabled={logsLoading}
              className="p-2 bg-[#222327] rounded-lg text-gray-400 hover:text-white hover:bg-[#2d2e33] transition-colors"
            >
              <RefreshCw size={20} className={logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="bg-[#18191c] rounded-2xl border border-[#2d2e33] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#222327] text-white uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Operación</th>
                    <th className="px-6 py-4">Fuente</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2e33]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#222327]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                      </td>
                      <td className="px-6 py-4">
                        {log.users?.username || log.users?.email || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          log.operation === 'publish' ? 'bg-green-500/20 text-green-500' :
                          log.operation === 'search' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-purple-500/20 text-purple-500'
                        }`}>
                          {log.operation === 'publish' ? 'Publicación' :
                           log.operation === 'search' ? 'Búsqueda' : 'Extracción URL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize">{log.source || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 ${
                          log.status === 'success' ? 'text-green-500' : 
                          log.status === 'error' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {log.status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                          {log.status === 'success' ? 'Éxito' : 'Error'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {log.details?.title || log.details?.query || log.details?.url || log.details?.error || '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !logsLoading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No hay registros disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Input Section */}
          <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <form onSubmit={activeTab === 'search' ? handleSearch : handleUrlScrape} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                {activeTab === 'search' ? (
                  <>
                    <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ej: iPhone 15, Laptop Gamer..."
                      className="w-full bg-[#222327] text-white pl-10 pr-4 py-3 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]"
                    />
                  </>
                ) : (
                  <>
                    <LinkIcon className="absolute left-3 top-3 text-gray-500" size={20} />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Pega la URL del producto de Amazon o Mercado Libre..."
                      className="w-full bg-[#222327] text-white pl-10 pr-4 py-3 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A]"
                    />
                  </>
                )}
              </div>
              
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className={`bg-[#222327] text-white px-4 py-3 rounded-xl border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A] ${
                  activeTab === 'url' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={activeTab === 'url'} // Auto-detected for URL
              >
                <option value="mercadolibre">Mercado Libre</option>
                <option value="amazon">Amazon</option>
              </select>

              <button
                type="submit"
                disabled={loading || (activeTab === 'search' ? !query.trim() : !urlInput.trim())}
                className="bg-[#2BD45A] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#25b84e] transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? <Loader2 className="animate-spin" /> : (activeTab === 'search' ? <Search size={20} /> : <DownloadIcon />)}
                {activeTab === 'search' ? 'Buscar' : 'Extraer'}
              </button>
            </form>
          </div>

          {/* Category Selection for Publishing */}
          <div className="flex flex-col md:flex-row gap-4 bg-[#18191c] p-4 rounded-xl border border-[#2d2e33]">
            <div className="flex items-center gap-2 flex-1">
                <Tag className="text-[#2BD45A]" size={20} />
                <span className="text-gray-300 font-medium whitespace-nowrap">Categoría:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#222327] text-white px-4 py-2 rounded-lg border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A] w-full"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
                <span className="text-gray-300 font-medium whitespace-nowrap">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#222327] text-white px-4 py-2 rounded-lg border border-[#2d2e33] focus:outline-none focus:border-[#2BD45A] w-full"
                >
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                  <option value="discount">Mayor Descuento</option>
                </select>
            </div>
          </div>

          {/* Results Grid */}
          {sortedResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedResults.map((deal) => (
                <div key={deal.id} className="bg-[#18191c] border border-[#2d2e33] rounded-2xl overflow-hidden flex flex-col group hover:border-[#2BD45A]/50 transition-colors">
                  <div 
                    className="relative aspect-square bg-white p-4 cursor-pointer group/image"
                    onClick={() => setPreviewDeal(deal)}
                  >
                    <Image
                      src={deal.image_url}
                      alt={deal.title}
                      fill
                      className={`object-contain ${deal.availability === 'out_of_stock' ? 'opacity-50 grayscale' : ''}`}
                    />
                    
                    {/* Hover Overlay for Preview */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full text-white">
                            <Eye size={24} />
                        </div>
                    </div>

                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md z-20">
                      {deal.source === 'mercadolibre' ? 'MELI' : 'AMZN'}
                    </div>
                    {deal.availability === 'out_of_stock' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                          AGOTADO
                        </span>
                      </div>
                    )}
                    {/* Shipping Badges */}
                    <div className="absolute bottom-2 left-2 flex flex-col gap-1 items-start">
                        {deal.shipping_info?.has_prime && (
                            <span className="bg-[#00A8E1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PRIME</span>
                        )}
                        {deal.shipping_info?.has_meli_plus && (
                            <span className="bg-[#9c27b0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">MELI+</span>
                        )}
                        {deal.shipping_info?.is_full && (
                            <span className="bg-[#00a650] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">FULL</span>
                        )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 min-h-[2.5rem]" title={deal.title}>
                      {deal.title}
                    </h3>
                    
                    {/* Shipping Info Text */}
                    <div className="mb-3 text-xs text-gray-400 flex items-start gap-1">
                        <Truck size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2" title={deal.shipping_info?.shipping_text}>
                            {deal.shipping_info?.free_shipping_label ? (
                                <span className="text-green-500 font-medium">Envío Gratis</span>
                            ) : deal.shipping_info?.shipping_cost ? (
                                <span>Envío: ${deal.shipping_info.shipping_cost}</span>
                            ) : (
                                deal.shipping_info?.shipping_text || 'Envío por definir'
                            )}
                        </span>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-[#2BD45A]">
                          ${deal.price.toLocaleString()} {deal.currency}
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
                            disabled={publishing === deal.id || deal.availability === 'out_of_stock'}
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
            !loading && (query || urlInput) && (
              <div className="text-center py-20 bg-[#18191c] rounded-2xl border border-[#2d2e33] border-dashed">
                <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin resultados</h3>
                <p className="text-gray-400">Intenta con otros términos o verifica la URL.</p>
              </div>
            )
          )}
        </>
      )}

      <DealPreviewModal 
        deal={previewDeal} 
        isOpen={!!previewDeal} 
        onClose={() => setPreviewDeal(null)} 
        categoryName={categories.find(c => c.id === selectedCategory)?.name}
      />
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
