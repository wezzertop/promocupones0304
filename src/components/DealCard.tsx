
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  MessageSquare, 
  Share2, 
  ExternalLink, 
  Clock, 
  Bookmark, 
  ArrowUp,
  ArrowDown,
  Store as StoreIcon,
  Tag,
  Truck,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Deal } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ReportModal from './ReportModal'

interface DealCardProps {
  deal: Deal
}

import Countdown from './ui/Countdown'

export default function DealCard({ deal }: DealCardProps) {
  const [votes, setVotes] = useState(deal.votes_count || 0)
  const [userVote, setUserVote] = useState<'hot' | 'cold' | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const supabase = createClient()
  const isExpired = deal.status === 'expired' || (deal.expires_at && new Date(deal.expires_at) < new Date())
  const hasMultipleImages = deal.image_urls && deal.image_urls.length > 1

  useEffect(() => {
    // Check if user has voted
    async function checkUserVote() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', session.user.id)
        .eq('deal_id', deal.id)
        .single()

      if (data) {
        setUserVote((data as any).vote_type as 'hot' | 'cold')
      }
      
      // Check if saved
      const { data: savedData } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('deal_id', deal.id)
        .single()
        
      if (savedData) setIsSaved(true)
    }

    checkUserVote()
  }, [deal.id, supabase])

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (deal.image_urls && currentImageIndex < deal.image_urls.length - 1) {
      setCurrentImageIndex(prev => prev + 1)
    } else {
      setCurrentImageIndex(0)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    } else if (deal.image_urls) {
      setCurrentImageIndex(deal.image_urls.length - 1)
    }
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 30) { // Threshold for swipe
      if (info.offset.x > 0) {
        // Swipe right -> prev
        if (currentImageIndex > 0) {
          setCurrentImageIndex(prev => prev - 1)
        } else if (deal.image_urls) {
          setCurrentImageIndex(deal.image_urls.length - 1)
        }
      } else {
        // Swipe left -> next
        if (deal.image_urls && currentImageIndex < deal.image_urls.length - 1) {
          setCurrentImageIndex(prev => prev + 1)
        } else {
          setCurrentImageIndex(0)
        }
      }
    }
  }

  const handleVote = async (type: 'hot' | 'cold') => {
    if (isVoting) return
    setIsVoting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Inicia sesión para votar')
        return
      }

      const previousVote = userVote
      const previousCount = votes
      
      let newVote = type
      let newCount = votes

      if (userVote === type) {
        newVote = null as any
        newCount = type === 'hot' ? votes - 1 : votes + 1
      } else {
        if (userVote === null) {
          newCount = type === 'hot' ? votes + 1 : votes - 1
        } else if (userVote === 'hot' && type === 'cold') {
          newCount = votes - 2
        } else if (userVote === 'cold' && type === 'hot') {
          newCount = votes + 2
        }
      }

      setVotes(newCount)
      setUserVote(newVote as any)

      let error;
      
      if (userVote === type) {
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('deal_id', deal.id)
        error = deleteError
      } else {
        const { error: upsertError } = await supabase
          .from('votes')
          .upsert({
            user_id: session.user.id,
            deal_id: deal.id,
            vote_type: type
          }, { onConflict: 'user_id, deal_id' })
        error = upsertError
      }

      if (error) throw error

    } catch (error) {
      console.error('Error al votar:', error)
      alert('Error al registrar el voto')
    } finally {
      setIsVoting(false)
    }
  }

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Inicia sesión para guardar ofertas')
        return
      }

      setIsSaved(!isSaved)
      
      if (!isSaved) {
        await supabase.from('saves').insert({ user_id: session.user.id, deal_id: deal.id })
      } else {
        await supabase.from('saves').delete().match({ user_id: session.user.id, deal_id: deal.id })
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      setIsSaved(!isSaved)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/oferta/${deal.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: deal.description,
          url
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Enlace copiado al portapapeles')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  return (
    <div className={cn(
      "group relative flex flex-row bg-[#09090b] rounded-xl md:rounded-3xl overflow-hidden border border-white/5 hover:border-[#2BD45A]/50 transition-all duration-500 shadow-xl shadow-black/50 hover:shadow-[#2BD45A]/10 min-h-[160px] md:h-[280px]",
      isExpired && "opacity-60 grayscale"
    )}>
      
      {/* Vertical Voting Sidebar (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center justify-center gap-2 w-16 bg-black/40 border-r border-white/5 py-4 shrink-0">
        <button 
          onClick={() => handleVote('hot')}
          className={cn(
            "p-2 rounded-xl transition-all hover:scale-110 active:scale-95 hover:bg-white/10",
            userVote === 'hot' ? "text-[#2BD45A]" : "text-zinc-500"
          )}
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
        
        <div className="flex flex-col items-center gap-0.5">
            <Flame 
                size={20} 
                className={cn(
                    "transition-colors",
                    userVote === 'hot' ? "text-[#2BD45A] fill-[#2BD45A]" :
                    userVote === 'cold' ? "text-blue-500 fill-blue-500" : "text-zinc-600"
                )} 
            />
            <span className={cn(
                "font-black text-sm",
                userVote === 'hot' ? "text-[#2BD45A]" :
                userVote === 'cold' ? "text-blue-500" : "text-white"
            )}>
                {votes}°
            </span>
        </div>
        
        <button 
          onClick={() => handleVote('cold')}
          className={cn(
            "p-2 rounded-xl transition-all hover:scale-110 active:scale-95 hover:bg-white/10",
            userVote === 'cold' ? "text-blue-500" : "text-zinc-500"
          )}
        >
          <ArrowDown size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Left Column (Mobile: Actions + Image + Votes) | (Desktop: Image only) */}
      <div className="flex flex-col w-[100px] md:w-[240px] shrink-0 border-r border-white/5 md:border-none">
        
        {/* Mobile Top Actions (Comments & Save) */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/5">
          <Link 
            href={`/oferta/${deal.id}#comments`}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors p-1 -m-1"
          >
            <MessageSquare size={16} />
            <span className="text-xs font-bold">{deal.comments_count || 0}</span>
          </Link>
          <button 
            onClick={handleSave}
            className={cn(
              "transition-colors p-1 -m-1",
              isSaved ? "text-[#2BD45A]" : "text-zinc-400 hover:text-white"
            )}
            aria-label={isSaved ? "Quitar de guardados" : "Guardar oferta"}
          >
            <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 flex items-center justify-center p-2 md:p-6 bg-white md:bg-white group/image">
          {/* Status Badge */}
          {deal.status !== 'active' && (
            <div className="absolute top-2 left-2 z-30 pointer-events-none">
              <span className={cn(
                "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-white shadow-sm",
                deal.status === 'pending' ? "bg-yellow-500" :
                deal.status === 'rejected' ? "bg-red-500" :
                deal.status === 'expired' ? "bg-zinc-500" :
                deal.status === 'revision' ? "bg-blue-500" :
                "bg-zinc-500"
              )}>
                {deal.status === 'pending' ? 'Pendiente' :
                 deal.status === 'rejected' ? 'Rechazada' :
                 deal.status === 'expired' ? 'Expirada' :
                 deal.status === 'revision' ? 'Revisión' :
                 deal.status}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-100/50 via-white to-white opacity-50" />
          
          {deal.image_urls && deal.image_urls.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImageIndex}
                  src={deal.image_urls[currentImageIndex]} 
                  alt={deal.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  drag={hasMultipleImages ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="w-full h-full object-contain max-h-[80px] md:max-h-none drop-shadow-xl cursor-grab active:cursor-grabbing touch-pan-y"
                />
              </AnimatePresence>
              
              {/* Carousel Controls */}
              {hasMultipleImages && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 text-black/50 hover:text-black transition-all opacity-0 group-hover/image:opacity-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 text-black/50 hover:text-black transition-all opacity-0 group-hover/image:opacity-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 pointer-events-none">
                    {deal.image_urls.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all", 
                          idx === currentImageIndex ? "bg-[#2BD45A]" : "bg-zinc-300"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-zinc-300 flex flex-col items-center gap-2">
              <Tag size={20} className="md:w-8 md:h-8" />
              <span className="text-xs font-medium uppercase tracking-wider text-center">Sin imagen</span>
            </div>
          )}

          {deal.expires_at && !isExpired && (
            <Countdown targetDate={deal.expires_at} />
          )}
        </div>

        {/* Mobile Bottom Actions (Votes) */}
        <div className="md:hidden flex items-center justify-center gap-6 py-2 border-t border-white/5 bg-white/5">
          <button 
            onClick={(e) => { e.preventDefault(); handleVote('hot'); }} 
            className={cn("p-2 -m-2", userVote === 'hot' ? "text-[#2BD45A]" : "text-zinc-500")}
            aria-label="Votar positivo"
          >
            <ArrowUp size={18} />
          </button>
          <span className={cn("text-sm font-bold", votes > 0 ? "text-white" : "text-zinc-500")}>{votes}</span>
          <button 
            onClick={(e) => { e.preventDefault(); handleVote('cold'); }} 
            className={cn("p-2 -m-2", userVote === 'cold' ? "text-red-500" : "text-zinc-500")}
            aria-label="Votar negativo"
          >
            <ArrowDown size={18} />
          </button>
        </div>
      </div>

      {/* Right Column (Content) */}
      <div className="flex-1 flex flex-col p-3 md:p-6 justify-between relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#2BD45A] opacity-5 blur-[80px] rounded-full pointer-events-none group-hover:opacity-10 transition-opacity duration-500" />

        {/* Header Meta */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            {deal.user?.avatar_url ? (
               <img src={deal.user.avatar_url} alt={deal.user.username} className="w-4 h-4 md:w-6 md:h-6 rounded-full ring-2 ring-[#2BD45A]/20" />
            ) : (
               <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] md:text-[10px] text-white ring-2 ring-white/5">
                 {deal.user?.username?.[0]?.toUpperCase() || 'U'}
               </div>
            )}
            <span className="text-zinc-400 max-w-[80px] truncate text-[10px] md:text-xs">
              <span className="text-zinc-200 font-semibold">{deal.user?.username || 'Anónimo'}</span>
            </span>
          </div>
          
          <span className="flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded text-[10px] text-zinc-400">
            <Clock size={10} />
            <span className="md:hidden">
              {formatTimeAgo(deal.created_at)}
            </span>
            <span className="hidden md:inline">
              {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale: es })}
            </span>
          </span>
        </div>

        {/* Title */}
        <Link href={`/oferta/${deal.id}`} className="block mb-1 md:mb-3 group-hover:translate-x-1 transition-transform duration-300 relative z-10">
          <h3 className="text-sm md:text-xl font-bold text-white leading-tight line-clamp-2 h-[2.5em] md:h-[2.2em] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400">
            {deal.title}
          </h3>
        </Link>

        {/* Price & Discount (Mobile Layout) */}
        <div className="flex items-center gap-2 mb-2 relative z-10 md:hidden">
           <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2BD45A] to-emerald-400">
             {deal.deal_price ? formatPrice(deal.deal_price) : 'Gratis'}
           </span>
           {deal.original_price && deal.original_price > (deal.deal_price || 0) && (
             <span className="text-xs text-zinc-600 line-through decoration-zinc-700">
               {formatPrice(deal.original_price)}
             </span>
           )}
           {deal.discount_percentage && (
             <span className="bg-[#2BD45A]/10 text-[#2BD45A] border border-[#2BD45A]/20 text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto">
               -{deal.discount_percentage}%
             </span>
           )}
        </div>

        {/* Desktop Price & Store (Hidden Mobile) */}
        <div className="hidden md:flex flex-col gap-2 mb-2 relative z-10">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 font-medium mb-0.5 uppercase tracking-wider">Precio</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2BD45A] to-emerald-400">
                {deal.deal_price ? formatPrice(deal.deal_price) : 'Gratis'}
              </span>
              {deal.original_price && deal.original_price > (deal.deal_price || 0) && (
                <span className="text-sm text-zinc-600 line-through font-medium decoration-2 decoration-zinc-700">
                  {formatPrice(deal.original_price)}
                </span>
              )}
              {deal.discount_percentage && (
                <span className="bg-[#2BD45A] text-black text-xs font-black px-2 py-0.5 rounded ml-2">
                  -{deal.discount_percentage}%
                </span>
              )}
            </div>
          </div>
            
          {/* Store & Location Info */}
          <div className="flex items-center gap-3">
            {deal.store && (
               <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded-md border border-white/5 hover:bg-white/10 transition-colors">
                  <StoreIcon size={12} className="text-[#2BD45A]" />
                  <span className="font-medium">{deal.store.name}</span>
               </div>
            )}
            
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 border border-white/5 px-2 py-1 rounded-md">
              {(deal as any).availability === 'in_store' ? (
                <>
                  <StoreIcon size={10} className="text-zinc-500" />
                  <span>Tienda Física</span>
                </>
              ) : (
                <>
                  <Globe size={10} className="text-blue-400" />
                  <span>Online</span>
                </>
              )}
            </div>

            {/* Shipping info */}
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Truck size={10} />
              <span>{(deal as any).shipping_cost === 0 ? 'Envío Gratis' : (deal as any).shipping_cost ? `+${formatPrice((deal as any).shipping_cost)}` : 'Envío no incl.'}</span>
            </div>
          </div>
        </div>

        {/* Description (Desktop only) */}
        <div className="hidden md:block mb-4 relative z-10 flex-1 min-h-0 overflow-hidden">
          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
            {deal.description}
          </p>
        </div>

        {/* Mobile Footer (Store + Button) */}
        <div className="mt-auto flex flex-col gap-2 relative z-10 md:hidden">
          
          <a 
            href={deal.deal_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#2BD45A] hover:bg-[#25b84e] text-black font-black py-3 rounded-xl text-sm uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-[#2BD45A]/20"
            onClick={(e) => e.stopPropagation()}
          >
            VER OFERTA <ExternalLink size={16} strokeWidth={3} />
          </a>
        </div>

        {/* Desktop Footer Actions (Hidden Mobile) */}
      <div className="hidden md:flex mt-auto items-center justify-between relative z-10 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Link 
            href={`/oferta/${deal.id}#comments`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group/btn"
          >
            <MessageSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-sm font-semibold">{deal.comments_count || 0}</span>
          </Link>

          <button 
            onClick={handleShare}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            title="Compartir"
          >
            <Share2 size={18} />
          </button>

          <button 
            onClick={handleSave}
            className={cn(
              "p-2 rounded-xl transition-all hover:bg-white/5",
              isSaved ? "text-[#2BD45A]" : "text-zinc-400 hover:text-white"
            )}
            title="Guardar"
          >
            <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
          </button>

          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all"
            title="Reportar"
          >
            <Flag size={18} />
          </button>
        </div>

        <a 
          href={deal.deal_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#2BD45A] text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(43,212,90,0.3)] text-sm uppercase tracking-wide"
          onClick={(e) => e.stopPropagation()}
        >
          Ver Oferta
          <ExternalLink size={16} strokeWidth={3} />
        </a>
      </div>
    </div>
    
    <ReportModal 
      isOpen={isReportModalOpen} 
      onClose={() => setIsReportModalOpen(false)} 
      targetId={deal.id} 
      targetType="deal" 
    />
  </div>
)
}
