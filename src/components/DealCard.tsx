'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  Globe,
  Copy,
  Check,
  Ticket,
  X,
  ArrowUpRight,
  Snowflake
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Deal } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store'
import ReportModal from './ReportModal'
import Countdown from './ui/Countdown'

interface DealCardProps {
  deal: Deal
  initialUserVote?: 'hot' | 'cold' | null
  initialIsSaved?: boolean
  variant?: 'default' | 'moderation'
  onApprove?: () => void
  onReject?: () => void
}

export default function DealCard({
  deal,
  initialUserVote = null,
  initialIsSaved = false,
  variant = 'default',
  onApprove,
  onReject
}: DealCardProps) {
  const [votes, setVotes] = useState(deal.votes_count || 0)
  const [userVote, setUserVote] = useState<'hot' | 'cold' | null>(initialUserVote)
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isVoting, setIsVoting] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { addToast } = useUIStore()
  const router = useRouter()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const supabase = createClient()
  const isExpired = deal.status === 'expired' || (deal.expires_at && new Date(deal.expires_at) < new Date())
  const hasMultipleImages = deal.image_urls && deal.image_urls.length > 1
  const isFreeShipping = deal.shipping_cost === 0 || deal.description?.toLowerCase().includes('envío gratis') || deal.description?.toLowerCase().includes('entrega gratis');
  const isCoupon = deal.deal_type === 'coupon'

  // Removed useEffect for data fetching to solve N+1 problem

  // Sync with props if they change (optional, depending on if we expect real-time updates from parent)
  useEffect(() => {
    if (initialUserVote !== undefined) setUserVote(initialUserVote)
    if (initialIsSaved !== undefined) setIsSaved(initialIsSaved)
  }, [initialUserVote, initialIsSaved])

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
        addToast({
          type: 'info',
          message: 'Inicia sesión',
          description: 'Debes iniciar sesión para votar en las ofertas'
        })
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
        const { error: deleteError } = await (supabase.from('votes') as any)
          .delete()
          .eq('user_id', session.user.id)
          .eq('deal_id', deal.id)
        error = deleteError
      } else {
        const { error: upsertError } = await (supabase.from('votes') as any)
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
      addToast({
        type: 'error',
        message: 'Error al votar',
        description: 'No se pudo registrar tu voto. Intenta nuevamente.'
      })
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

      // Optimistic update
      const newSavedState = !isSaved
      setIsSaved(newSavedState)

      if (newSavedState) {
        await (supabase.from('saves') as any).insert({ user_id: session.user.id, deal_id: deal.id })
      } else {
        await (supabase.from('saves') as any).delete().match({ user_id: session.user.id, deal_id: deal.id })
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      setIsSaved(!isSaved) // Revert
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

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Si ya está copiado y el usuario vuelve a hacer clic, abrir el enlace
    if (isCopied) {
      window.open(deal.deal_url, '_blank')
      return
    }

    if (deal.coupon_code) {
      navigator.clipboard.writeText(deal.coupon_code)
      setIsCopied(true)
      addToast({
        type: 'success',
        message: 'Cupón copiado',
        description: 'El código se ha guardado en tu portapapeles'
      })
      // No resetear isCopied automáticamente tan rápido, o manejarlo diferente
      // setTimeout(() => setIsCopied(false), 2000) 

      // Also open the link automatically
      window.open(deal.deal_url, '_blank')
    } else {
      // Fallback si no hay código (solo visitar)
      window.open(deal.deal_url, '_blank')
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

    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}hrs`
    return `${days}d`
  }

  const dealLink = variant === 'moderation'
    ? `/oferta/${deal.id}?from=/admin/moderation&label=Volver a moderación`
    : `/oferta/${deal.id}`

  const renderHeaderLeft = () => (
    <div className="flex flex-1 items-center gap-1.5 text-[10px] md:text-xs min-w-0 pr-2">
      {deal.user?.username ? (
        <Link href={`/usuario/${encodeURIComponent(deal.user.username)}`} className="flex items-center gap-1.5 hover:underline shrink-0 min-w-0" onClick={(e) => e.stopPropagation()}>
          {deal.user.avatar_url ? (
            <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0 rounded-[10px] overflow-hidden">
              <Image src={deal.user.avatar_url} alt="" width={20} height={20} className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0 rounded-[10px] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 dark:text-zinc-300 font-bold">
              {deal.user.username[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate max-w-[90px] sm:max-w-[120px]">{deal.user.username}</span>
        </Link>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0 rounded-[10px] bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 dark:text-zinc-300 font-bold">U</div>
          <span className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">Anónimo</span>
        </div>
      )}
      <span className="text-zinc-600 font-bold shrink-0">•</span>
      {deal.store && (
        <span className="text-xs sm:text-sm text-[#07B5A7] font-black truncate shrink-0 max-w-[100px] sm:max-w-none">{deal.store.name}</span>
      )}
    </div>
  )

  const renderHeaderRight = () => (
    <div className="flex items-center gap-0.5 md:gap-1 shrink-0 text-zinc-500">
      <div className="flex items-center gap-1.5 text-[10px] md:text-xs px-1.5 py-1" title={new Date(deal.created_at).toLocaleString('es-MX')}>
        <Clock size={14} className="md:w-4 md:h-4 stroke-[2px]" />
        <span className="font-medium align-middle tracking-wide">{formatTimeAgo(deal.created_at)}</span>
      </div>
      <Link href={`${dealLink}#comments`} className="flex items-center gap-1.5 text-[10px] md:text-xs px-1.5 py-1 rounded-[6px] hover:bg-surface-hover hover:text-zinc-300 transition-colors" title="Comentarios" onClick={(e) => e.stopPropagation()}>
        <MessageSquare size={14} className="md:w-4 md:h-4 stroke-[2px]" />
        <span className="font-medium align-middle">{deal.comments_count || 0}</span>
      </Link>
      <span className="text-border mx-0.5 hidden sm:inline">|</span>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }} className="p-1.5 rounded-[6px] hover:bg-surface-hover hover:text-zinc-300 transition-colors" title="Compartir">
        <Share2 size={14} className="md:w-4 md:h-4 stroke-[2px]" />
      </button>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(); }} className={cn("p-1.5 rounded-[6px] hover:bg-surface-hover transition-colors", isSaved ? "text-[#07B5A7]" : "hover:text-zinc-300")} title="Guardar">
        <Bookmark size={14} className={cn("md:w-4 md:h-4 stroke-[2px]", isSaved ? "fill-current" : "")} />
      </button>
    </div>
  )

  return (
    <div
      onClick={(e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          return;
        }
        // Redirigir al hacer clic en el contenedor principal si no estamos haciendo clic en algo interactivo
        const target = e.target as HTMLElement
        const isInteractive = target.closest('button, a, svg, span:not(.pointer-events-none)')
        if (!isInteractive && !isCoupon) {
          window.open(deal.deal_url, '_blank', 'noopener,noreferrer')
        }
      }}
      className={cn(
        "group relative flex flex-col md:grid md:grid-cols-[50px_180px_1fr] bg-white dark:bg-[#18181b] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all duration-300 md:hover:scale-[1.01] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-md hover:shadow-xl dark:shadow-black/50 w-full mx-auto md:mx-0 cursor-pointer",
        deal.status === 'expired' && "opacity-80 grayscale-[20%]",
        deal.status !== 'active' && "opacity-75"
      )}>

      {/* --- MOBILE HEADER --- */}
      <div className="flex md:hidden items-center justify-between w-full p-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 relative z-10 bg-zinc-50 dark:bg-[#121214] overflow-hidden">
        {renderHeaderLeft()}
        {renderHeaderRight()}
      </div>

      {/* Component A: Vertical Voting Sidebar */}
      {variant === 'default' && (
        <div className="hidden md:flex flex-col items-center justify-between gap-1 md:gap-2 w-full bg-zinc-50 dark:bg-[#121214] border-r border-zinc-200 dark:border-zinc-800 py-2 md:py-4 z-10">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('hot'); }}
            className={cn(
              "p-1.5 rounded-[10px] transition-all active:scale-95",
              userVote === 'hot' ? "text-orange-500 bg-orange-500/20" : "text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10"
            )}
          >
            <ArrowUp size={20} className={cn(userVote === 'hot' && "drop-shadow-sm")} strokeWidth={3} />
          </button>

          <div className={cn(
            "flex flex-col items-center justify-center gap-0.5 font-black text-xs md:text-sm transition-colors",
            userVote === 'hot' ? "text-orange-500" :
              userVote === 'cold' ? "text-blue-500" : "text-zinc-900 dark:text-zinc-100"
          )}>
            {votes >= 0 ? (
              <Flame size={16} strokeWidth={2.5} className={cn(userVote === 'hot' ? "fill-orange-500/20 text-orange-500" : "text-orange-500/70")} />
            ) : (
              <Snowflake size={16} strokeWidth={2.5} className={cn(userVote === 'cold' ? "fill-blue-500/20 text-blue-500" : "text-blue-500/70")} />
            )}
            <span>{votes}°</span>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('cold'); }}
            className={cn(
              "p-1.5 rounded-[10px] transition-all active:scale-95",
              userVote === 'cold' ? "text-blue-500 bg-blue-500/20" : "text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10"
            )}
          >
            <ArrowDown size={20} className={cn(userVote === 'cold' && "drop-shadow-sm")} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* --- MD CONTENTS WRAPPER --- */}
      <div className="grid grid-cols-[115px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] w-full md:contents p-2.5 md:p-0 gap-3 md:gap-0 h-full bg-transparent">

        {/* Component B: Image Area */}
        <div className="w-full flex flex-col items-center justify-start md:justify-center p-1.5 md:p-3 relative group/image bg-zinc-50 dark:bg-[#121214] md:border-r md:border-y-0 md:border-l-0 border border-zinc-200 dark:border-zinc-800 rounded-xl md:rounded-none shadow-sm md:shadow-none">
          {deal.status !== 'active' && (
            <div className="absolute top-2 left-2 z-30 pointer-events-none">
              <span className={cn(
                "px-2 py-0.5 rounded-[10px] text-[8px] md:text-[10px] font-black uppercase tracking-wider text-white shadow-sm",
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

          <div className="relative w-full aspect-square bg-white dark:bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 md:border-0">
            {deal.image_urls && deal.image_urls.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    drag={hasMultipleImages ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="w-full h-full relative cursor-grab active:cursor-grabbing touch-pan-y"
                  >
                    <Image
                      src={deal.image_urls[currentImageIndex]}
                      alt={deal.title}
                      fill
                      className="object-contain p-0.5 md:p-0"
                      sizes="(max-width: 768px) 115px, 200px"
                      priority={currentImageIndex === 0}
                      unoptimized
                    />
                  </motion.div>
                </AnimatePresence>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-[10px] bg-black/40 hover:bg-black/80 text-white transition-all opacity-0 group-hover/image:opacity-100"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-[10px] bg-black/40 hover:bg-black/80 text-white transition-all opacity-0 group-hover/image:opacity-100"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <div className="md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-0.5 pointer-events-none bg-black/40 px-1.5 py-0.5 rounded-[10px]">
                      {deal.image_urls.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-1 h-1 rounded-[10px] transition-all",
                            idx === currentImageIndex ? "bg-white" : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-zinc-600 flex flex-col items-center justify-center h-full bg-zinc-100 dark:bg-[#171717]">
                <Tag size={24} className="mb-2 text-zinc-400" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-center text-zinc-500">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Mobile Voting */}
          {variant === 'default' && (
            <div className="flex md:hidden items-center justify-between w-full mt-2 bg-white dark:bg-[#18181b] rounded-lg p-0.5 px-1 border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('cold'); }}
                className={cn(
                  "p-1.5 rounded-md transition-all active:scale-95",
                  userVote === 'cold' ? "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20" : "text-zinc-400 hover:text-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/10"
                )}
              >
                <ArrowDown size={14} className={cn(userVote === 'cold' && "drop-shadow-sm")} strokeWidth={3} />
              </button>

              <div className={cn(
                "flex items-center justify-center gap-0.5 font-black text-[11px] transition-colors",
                userVote === 'hot' ? "text-orange-500" :
                  userVote === 'cold' ? "text-blue-500" : "text-zinc-900 dark:text-zinc-100"
              )}>
                {votes >= 0 ? (
                  <Flame size={12} strokeWidth={2.5} className={cn(userVote === 'hot' ? "fill-orange-500/10 dark:fill-orange-500/20 text-orange-500" : "text-orange-500/70")} />
                ) : (
                  <Snowflake size={12} strokeWidth={2.5} className={cn(userVote === 'cold' ? "fill-blue-500/10 dark:fill-blue-500/20 text-blue-500" : "text-blue-500/70")} />
                )}
                <span>{votes}°</span>
              </div>

              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('hot'); }}
                className={cn(
                  "p-1.5 rounded-md transition-all active:scale-95",
                  userVote === 'hot' ? "text-orange-500 bg-orange-500/10 dark:bg-orange-500/20" : "text-zinc-400 hover:text-orange-500 hover:bg-orange-500/5 dark:hover:bg-orange-500/10"
                )}
              >
                <ArrowUp size={14} className={cn(userVote === 'hot' && "drop-shadow-sm")} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        {/* Component C: Info Body */}
        <div className="flex flex-col p-1.5 md:p-[20px] relative min-w-0 justify-between overflow-hidden h-full">

          <div className="flex flex-col gap-1 md:gap-2 min-w-0 w-full overflow-hidden">
            {/* Desktop Header Fragment */}
            <div className="hidden md:flex items-center justify-between w-full gap-2">
              {renderHeaderLeft()}
              {renderHeaderRight()}
            </div>

            {/* Body */}
            {deal.expires_at && !isExpired && (
              <div className="flex items-center gap-1.5 text-rose-500 mb-0.5 mt-0.5">
                <Clock size={12} className="stroke-[2.5px] shrink-0 md:w-3.5 md:h-3.5" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-1">Termina en <Countdown targetDate={deal.expires_at} className="bg-transparent border-none text-current p-0 m-0 font-bold inline" /></span>
              </div>
            )}

            <Link href={dealLink} className="block group/link" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-[13px] md:text-xl leading-snug md:leading-tight line-clamp-3 md:line-clamp-1 group-hover/link:text-[#07B5A7] transition-colors">
                {deal.title}
              </h3>
            </Link>

            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] md:text-sm line-clamp-1 md:line-clamp-2 mt-0.5 md:mt-1 leading-relaxed">
              {deal.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between mt-2 md:mt-4 w-full gap-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex-1 flex flex-col justify-center min-w-0 pr-1 gap-1 md:gap-1.5">
              {isCoupon ? (
                <>
                  <div className="flex items-center flex-nowrap gap-1.5 md:gap-2">
                    <span className="text-lg md:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none shrink-0 tracking-tight">
                      {deal.discount_percentage ? `${deal.discount_percentage}% OFF` : (deal.discount_amount ? `${formatPrice(deal.discount_amount)} OFF` : 'Cupón')}
                    </span>
                    {deal.coupon_code && (
                      <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-[10px] text-[10px] md:text-xs font-black uppercase font-mono border border-purple-200 dark:border-purple-500/30 shrink-0">
                        {deal.coupon_code}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center flex-nowrap gap-1.5 md:gap-2">
                    <span className="text-[17px] md:text-2xl font-black text-[#07B5A7] leading-none shrink-0 tracking-tight">
                      {deal.deal_price ? formatPrice(deal.deal_price) : 'Gratis'}
                    </span>
                    {deal.original_price && deal.original_price > (deal.deal_price || 0) && (
                      <span className="text-[10px] md:text-sm font-medium text-zinc-400 dark:text-zinc-500 line-through decoration-red-500/50 decoration-1 shrink-0">
                        {formatPrice(deal.original_price)}
                      </span>
                    )}
                    {deal.discount_percentage && (
                      <span className="bg-zinc-900 dark:bg-[#f5cb17] text-white dark:text-zinc-900 text-[9px] sm:text-[11px] md:text-xs font-black px-1.5 py-0.5 rounded-[6px] leading-none flex items-center shrink-0">
                        -{deal.discount_percentage}%
                      </span>
                    )}
                  </div>

                  {isFreeShipping ? (
                    <div className="flex w-fit items-center gap-0.5 bg-lime-100 dark:bg-lime-500/10 px-1.5 h-[20px] md:h-[24px] rounded-[6px] text-[9px] md:text-[10px] font-bold uppercase tracking-wide border border-lime-200 dark:border-lime-500/20">
                      <Truck size={10} className="md:w-3 md:h-3 text-lime-600 shrink-0" strokeWidth={2} />
                      <span className="text-lime-700 dark:text-lime-500 hover:opacity-100">GRATIS</span>
                    </div>
                  ) : (
                    <div className="flex w-fit items-center gap-0.5 bg-rose-100 dark:bg-rose-500/10 px-1.5 h-[20px] md:h-[24px] rounded-[6px] text-[9px] md:text-[10px] font-bold uppercase tracking-wide border border-rose-200 dark:border-rose-500/20">
                      <Truck size={10} className="md:w-3 md:h-3 text-rose-500 shrink-0" strokeWidth={2} />
                      <span className="text-rose-600 dark:text-rose-500 hover:opacity-100">OFF</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {isCoupon ? (
              <button
                onClick={handleCopyCode}
                className={cn(
                  "flex items-center gap-1 md:gap-1.5 px-2 md:px-4 h-[28px] md:h-[36px] shrink-0 rounded-[8px] font-black text-[9px] md:text-xs uppercase tracking-wider transition-all ml-1 md:ml-2 shadow-md",
                  isCopied ? "bg-zinc-100 dark:bg-white text-zinc-900 dark:text-black border border-black/10 dark:border-white/20" : "bg-zinc-900 dark:bg-purple-600 text-white dark:text-white hover:opacity-90 border border-transparent"
                )}
                onClickCapture={(e) => e.stopPropagation()}
              >
                <span className="hidden sm:inline">{isCopied ? 'COPIADO' : 'VER CUPÓN'}</span>
                <span className="sm:hidden">{isCopied ? 'OK' : 'CUPÓN'}</span>
                <ExternalLink size={12} strokeWidth={3} className={cn("md:w-4 md:h-4", isCopied ? "hidden" : "block")} />
                <Check size={12} strokeWidth={3} className={cn("md:w-4 md:h-4", isCopied ? "block" : "hidden")} />
              </button>
            ) : (
              <a
                href={deal.deal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 h-[28px] md:h-[36px] bg-[#07B5A7] hover:bg-[#07B5A7]/90 text-white dark:text-black font-black text-[9px] md:text-xs shrink-0 rounded-[8px] uppercase tracking-wider transition-colors ml-1 md:ml-2 shadow-md hover:shadow-[#07B5A7]/20"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="hidden sm:inline">IR A OFERTA</span>
                <span className="sm:hidden">VER</span>
                <ArrowUpRight size={12} strokeWidth={3} className="md:w-4 md:h-4" />
              </a>
            )}
          </div>

          {variant === 'moderation' && (
            <div className="flex items-center gap-2 md:gap-3 w-full mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReject?.(); }}
                className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 h-[32px] md:h-[36px] rounded-[10px] text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <X size={14} className="md:w-4 md:h-4" /> Rechazar
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApprove?.(); }}
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#07B5A7]/10 dark:hover:bg-[#07B5A7]/20 text-emerald-600 dark:text-[#07B5A7] h-[32px] md:h-[36px] rounded-[10px] text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check size={14} className="md:w-4 md:h-4" /> Aprobar
              </button>
            </div>
          )}

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
