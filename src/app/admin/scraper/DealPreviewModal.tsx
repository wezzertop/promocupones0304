import { ScrapedDeal } from '@/lib/scraper'
import { X, ExternalLink, Store as StoreIcon, Globe, Tag, Truck, MapPin, Calendar, Clock, Share2, AlertCircle, Maximize2, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Countdown from '@/components/ui/Countdown' // Import Countdown component

interface DealPreviewModalProps {
  deal: ScrapedDeal | null
  isOpen: boolean
  onClose: () => void
  categoryName?: string
}

export default function DealPreviewModal({ deal, isOpen, onClose, categoryName = 'Categoría' }: DealPreviewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null) // State for expiration

  // Reset image index when deal changes
  useEffect(() => {
    if (isOpen && deal) {
        setCurrentImageIndex(0)
        setIsDescriptionExpanded(false)
        // Use the actual expiration date from the scraped deal
        if (deal.expires_at) {
            setExpiresAt(new Date(deal.expires_at))
        } else {
            setExpiresAt(null)
        }
    }
  }, [isOpen, deal])

  if (!isOpen || !deal) return null

  // Image Logic
  const dealImages = deal.image_urls && deal.image_urls.length > 0 ? deal.image_urls : [deal.image_url]
  const imageUrl = dealImages[currentImageIndex] || '/placeholder.jpg'
  const hasMultipleImages = dealImages.length > 1

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % dealImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + dealImages.length) % dealImages.length)
  }

  // Price Logic
  const originalPrice = deal.original_price || 0
  const dealPrice = deal.price || 0
  const discount = originalPrice > 0
    ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
    : 0

  // Store Name Mapping
  const storeName = deal.source === 'amazon' ? 'Amazon' : deal.source === 'mercadolibre' ? 'Mercado Libre' : deal.source

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#121212] rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#18191c]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="bg-[#2BD45A] text-black text-xs px-2 py-0.5 rounded font-bold uppercase">Previsualización</span>
            Vista de Usuario Final
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
                
                {/* Left Column: Images (7 cols) */}
                <div className="lg:col-span-7 space-y-4 order-1">
                    {/* Countdown Banner */}
                    {expiresAt && (
                        <Countdown targetDate={expiresAt} className="relative bg-black/40 rounded-xl border border-[#2BD45A]/20" size="md" />
                    )}

                    <div className="glass-panel p-4 relative group overflow-hidden rounded-2xl bg-[#18191c] border border-white/5 flex flex-col gap-3">
                        
                        {/* Main Image */}
                        <div className="relative rounded-xl overflow-hidden bg-white p-8 flex items-center justify-center w-full aspect-square sm:aspect-video group/image border border-white/5">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    src={imageUrl}
                                    alt={deal.title}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="object-contain w-full h-full max-h-[400px]"
                                />
                            </AnimatePresence>

                            {/* Controls */}
                            {hasMultipleImages && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 text-black/50 hover:bg-black/20 hover:text-black rounded-full transition-colors z-20"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 text-black/50 hover:bg-black/20 hover:text-black rounded-full transition-colors z-20"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                        {dealImages.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full transition-all",
                                                    idx === currentImageIndex ? "bg-black w-3" : "bg-black/30"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {hasMultipleImages && (
                            <div className="flex gap-2.5 overflow-x-auto py-1 px-1 scrollbar-hide">
                                {dealImages.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={cn(
                                            "relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all bg-white p-1",
                                            idx === currentImageIndex ? "border-[#2BD45A]" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Info (5 cols) */}
                <div className="lg:col-span-5 space-y-4 order-2">
                    <div className="glass-panel rounded-2xl bg-[#18191c] border border-white/5 p-5 space-y-4">
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wider mb-2 uppercase">
                            <div className="flex items-center gap-1.5 text-zinc-300">
                                <StoreIcon className="w-3 h-3 text-zinc-500" />
                                <span className="text-white">{storeName}</span>
                            </div>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <Globe className="w-3 h-3 text-blue-400" />
                                <span>Online</span>
                            </div>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1.5 text-[#2BD45A]">
                                <Tag className="w-3 h-3" />
                                <span>{categoryName}</span>
                            </div>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                                <Truck className="w-3 h-3" />
                                <span className="whitespace-nowrap">
                                    {(deal.shipping_info?.free_shipping_label || deal.shipping_info?.shipping_text?.toLowerCase().includes('gratis')) ? 'Envío Gratis' : 
                                     deal.shipping_info?.shipping_cost ? `+${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(deal.shipping_info.shipping_cost)}` : 
                                     'Envío no incl.'}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold text-white leading-tight">
                            {deal.title}
                        </h1>

                        {/* Price Block */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex flex-col min-w-0">
                                <span className="text-3xl font-bold text-white tracking-tight truncate">
                                    ${dealPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                                {originalPrice > 0 && (
                                    <span className="text-sm text-zinc-500 line-through">
                                        ${originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                )}
                            </div>
                            {discount > 0 && (
                                <div className="bg-[#2BD45A] text-black px-2.5 py-1 rounded-lg font-black text-sm shadow-lg shadow-[#2BD45A]/20 transform -rotate-2">
                                    -{discount}%
                                </div>
                            )}
                        </div>

                        {/* Shipping & Payment Details */}
                        {(deal.shipping_info || deal.payment_info?.has_msi) && (
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm space-y-2">
                                <h4 className="text-zinc-400 text-xs font-bold uppercase">Detalles de Compra</h4>
                                <div className="flex flex-wrap gap-2">
                                    {deal.shipping_info?.has_prime && (
                                        <span className="bg-[#00A8E1] text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                            <span className="italic font-black">prime</span>
                                        </span>
                                    )}
                                    {deal.shipping_info?.has_meli_plus && (
                                        <span className="bg-[#9c27b0] text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                            <span>Meli+</span>
                                        </span>
                                    )}
                                    {deal.shipping_info?.is_full && (
                                        <span className="bg-[#00a650] text-white text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                            <span className="italic font-black">FULL</span>
                                        </span>
                                    )}
                                    {deal.shipping_info?.free_shipping_label && (
                                        <span className="bg-green-600/20 text-green-500 text-xs px-2 py-0.5 rounded font-bold border border-green-600/20">Envío Gratis</span>
                                    )}
                                    {deal.payment_info?.has_msi && (
                                        <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded font-bold border border-blue-600/20 flex items-center gap-1">
                                            <CreditCard size={10} /> MSI
                                        </span>
                                    )}
                                </div>
                                {deal.shipping_info?.shipping_text && (
                                    <p className="text-zinc-300 text-xs leading-relaxed opacity-80 mt-2">
                                        {deal.shipping_info.shipping_text}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* CTA */}
                        <a
                            href={deal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 hover:shadow-[#2BD45A]/40 hover:-translate-y-0.5"
                        >
                            Ver en {storeName} <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Description */}
                        <div className="pt-3 border-t border-white/5">
                            <h4 className="text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">Descripción</h4>
                            <div className="relative">
                                <p className={cn("text-zinc-400 text-sm leading-relaxed whitespace-pre-line", !isDescriptionExpanded && "line-clamp-6")}>
                                    {deal.description}
                                </p>
                                {deal.description && deal.description.length > 200 && (
                                    <button 
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-[#2BD45A] text-xs font-bold mt-1.5 hover:underline focus:outline-none"
                                    >
                                        {isDescriptionExpanded ? "Mostrar menos" : "Mostrar más"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-white/5 p-2 rounded-lg">
                            <Clock className="w-3 h-3" />
                            <span>Extraído el {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
