import { ScrapedDeal } from '@/lib/scraper'
import { ExternalLink, Upload, Loader2, CheckCircle, Truck, Eye, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ScraperDealCardProps {
  deal: ScrapedDeal
  isPublished: boolean
  isPublishing: boolean
  isSelected: boolean
  onToggleSelect: (dealId: string) => void
  onPublish: (deal: ScrapedDeal) => void
}

export default function ScraperDealCard({ 
  deal, 
  isPublished, 
  isPublishing, 
  isSelected,
  onToggleSelect,
  onPublish
}: ScraperDealCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  const discountPercentage = deal.original_price 
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : 0

  return (
    <div className={cn(
      "group relative flex flex-col md:flex-row bg-[#09090b] rounded-xl md:rounded-3xl overflow-hidden border border-white/5 transition-all duration-300 md:hover:scale-[1.01] shadow-xl shadow-black/50 hover:shadow-2xl h-auto w-full",
      isPublished ? "border-green-500/20 shadow-green-500/5" : "hover:border-[#2BD45A]/50 hover:shadow-[#2BD45A]/10",
      deal.availability === 'out_of_stock' && "opacity-60 grayscale",
      isSelected && "border-[#2BD45A] ring-1 ring-[#2BD45A]"
    )}>
      
      {/* Checkbox Overlay */}
      <div className="absolute top-4 left-4 z-40">
        <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(deal.id)}
            disabled={isPublished || deal.availability === 'out_of_stock'}
            className="w-5 h-5 rounded border-gray-600 bg-[#222327] text-[#2BD45A] focus:ring-[#2BD45A] cursor-pointer"
        />
      </div>

      {/* Image Section */}
      <div 
        className="flex flex-col w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-white p-4 relative cursor-pointer group/image"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="relative w-full h-[200px] md:h-full flex items-center justify-center">
            <Image
              src={deal.image_url}
              alt={deal.title}
              fill
              className="object-contain p-2 transition-transform duration-500 group-hover/image:scale-110"
              sizes="(max-width: 768px) 100vw, 240px"
            />
            
            {/* Source Badge */}
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg z-20 border border-white/10 shadow-lg">
                {deal.source === 'mercadolibre' ? 'MELI' : 'AMZN'}
            </div>

            {/* Out of Stock Overlay */}
            {deal.availability === 'out_of_stock' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                  AGOTADO
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 md:p-6 justify-between relative bg-gradient-to-br from-[#09090b] to-black">
        
        <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
            {/* Header / Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap pl-8 md:pl-0">
                {deal.shipping_info?.has_prime && (
                    <span className="bg-[#00A8E1]/10 text-[#00A8E1] border border-[#00A8E1]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">PRIME</span>
                )}
                {deal.shipping_info?.has_meli_plus && (
                    <span className="bg-[#9c27b0]/10 text-[#9c27b0] border border-[#9c27b0]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">MELI+</span>
                )}
                {deal.shipping_info?.is_full && (
                    <span className="bg-[#00a650]/10 text-[#00a650] border border-[#00a650]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">FULL</span>
                )}
                {deal.shipping_info?.free_shipping_label && (
                    <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Truck size={10} /> Envío Gratis
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 
                className="text-base md:text-lg font-bold text-white leading-tight mb-2 line-clamp-2 hover:text-[#2BD45A] transition-colors"
                title={deal.title}
            >
                {deal.title}
            </h3>

            {/* Shipping Text */}
            <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                <span className="line-clamp-1">
                    {deal.shipping_info?.shipping_text || 'Sin información de envío'}
                </span>
            </div>
            
            {/* Expanded Details */}
            {expanded && (
                <div className="mb-4 pt-4 border-t border-white/5 animate-fade-in">
                    <h4 className="text-sm font-bold text-white mb-2">Descripción</h4>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar">
                        {deal.description || 'No hay descripción disponible.'}
                    </p>
                    
                    {deal.payment_info?.has_msi && (
                         <div className="mt-3 inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/20">
                             <span className="font-bold">MSI</span> Meses sin intereses disponibles
                         </div>
                    )}
                </div>
            )}
        </div>

        {/* Pricing & Actions */}
        <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-3">
                    <div className="flex flex-col">
                        <span className="text-2xl md:text-3xl font-black text-[#2BD45A] tracking-tight">
                            ${deal.price.toLocaleString()}
                        </span>
                        {deal.original_price && (
                            <span className="text-xs text-zinc-500 font-medium line-through">
                                ${deal.original_price.toLocaleString()}
                            </span>
                        )}
                    </div>
                    
                    {discountPercentage > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg mb-1 animate-pulse">
                            -{discountPercentage}%
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                        title={expanded ? "Menos detalles" : "Más detalles"}
                    >
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    <a 
                    href={deal.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                    title="Ver en tienda original"
                    >
                    <ExternalLink size={20} />
                    </a>

                    {isPublished ? (
                    <button 
                        disabled 
                        className="flex-1 sm:flex-none px-4 bg-green-500/10 text-green-500 border border-green-500/20 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-default"
                    >
                        <CheckCircle size={18} />
                        Publicado
                    </button>
                    ) : (
                    <button
                        onClick={() => onPublish(deal)}
                        disabled={isPublishing || deal.availability === 'out_of_stock'}
                        className="flex-1 sm:flex-none px-6 bg-[#2BD45A] hover:bg-[#25b84e] text-black h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(43,212,90,0.2)] hover:shadow-[0_0_30px_rgba(43,212,90,0.4)] whitespace-nowrap"
                    >
                        {isPublishing ? (
                        <Loader2 size={18} className="animate-spin" />
                        ) : (
                        <>
                            <Upload size={18} />
                            Publicar
                        </>
                        )}
                    </button>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}