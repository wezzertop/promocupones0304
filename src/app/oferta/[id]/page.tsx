'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ExternalLink, ThumbsUp, Share2, Clock, Tag, ChevronLeft, ChevronRight, Calendar, MapPin, AlertCircle, ArrowUp, ArrowDown, Edit2, Flame, Maximize2, X } from 'lucide-react'
import CommentsSection from '@/components/CommentsSection'
import Map from '@/components/DynamicMap'
import { useEffect, useState, use } from 'react'
import { useUIStore } from '@/lib/store'

import { cn } from '@/lib/utils'

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { setHeaderVisible } = useUIStore()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Voting state
  const [votes, setVotes] = useState(0)
  const [userVote, setUserVote] = useState<'hot' | 'cold' | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  
  // Image State
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const dealImages = deal?.image_urls || []
  const hasMultipleImages = dealImages.length > 1

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % dealImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + dealImages.length) % dealImages.length)
  }

  useEffect(() => {
    // Reset image index when deal changes
    setCurrentImageIndex(0)
  }, [id])

  // Description state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  
  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null)

  useEffect(() => {
    // Force header visible on mount
    setHeaderVisible(true)
    
    // Disable scroll hide logic by setting a flag or simply re-enabling it on unmount if needed
    // But since the store is global, we might want to ensure it stays visible
    const handleScroll = () => {
      setHeaderVisible(true)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      setHeaderVisible(true) // Reset on unmount
    }
  }, [setHeaderVisible])

  // Countdown Logic
  useEffect(() => {
    if (!deal) return
    
    const expiresAt = deal.expires_at ? new Date(deal.expires_at) : null
    const isExpired = expiresAt ? new Date() > expiresAt : false

    if (!expiresAt || isExpired) {
        setTimeLeft(null)
        return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = expiresAt.getTime() - now

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        }
      } else {
        return null
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [deal])

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUserId(session.user.id)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    async function fetchDeal() {
      const supabase = createClient()
      const { data: dealData, error } = await supabase
        .from('deals')
        .select(`
          *,
          user:users!deals_user_id_fkey(id, username, avatar_url),
          category:categories(name),
          comments(count)
        `)
        .eq('id', id)
        .single()

      if (error || !dealData) {
        console.error('Error fetching deal:', error)
        // Handle error or not found
      } else {
        setDeal({
          ...(dealData as any),
          comments_count: (dealData as any).comments?.[0]?.count || 0
        })
        setVotes((dealData as any).votes_count || 0)
      }
      setLoading(false)
    }
    fetchDeal()
  }, [id])

  // Fetch user vote
  useEffect(() => {
    async function fetchUserVote() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('deal_id', id)
          .eq('user_id', session.user.id)
          .single()
          
        if (voteData) {
          setUserVote((voteData as any).vote_type as 'hot' | 'cold')
        }
      }
    }
    fetchUserVote()
  }, [id])

  const handleVote = async (type: 'hot' | 'cold') => {
    if (isVoting) return
    setIsVoting(true)

    const supabase = createClient()

    // Store previous state for rollback
    const previousVote = userVote
    const previousCount = votes

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Inicia sesión para votar')
        setIsVoting(false)
        return
      }

      let newVote: 'hot' | 'cold' | null = type
      let newCount = votes
      let shouldDelete = false

      if (userVote === type) {
        // Toggle off
        newVote = null
        newCount = type === 'hot' ? votes - 1 : votes + 1
        shouldDelete = true
      } else {
        // New vote or change vote
        if (userVote === null) {
          newCount = type === 'hot' ? votes + 1 : votes - 1
        } else if (userVote === 'hot' && type === 'cold') {
          newCount = votes - 2
        } else if (userVote === 'cold' && type === 'hot') {
          newCount = votes + 2
        }
      }

      setVotes(newCount)
      setUserVote(newVote)

      if (shouldDelete) {
         const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('deal_id', id)
         
         if (error) throw error
      } else {
         const { error } = await supabase
          .from('votes')
          .upsert({
            user_id: session.user.id,
            deal_id: id,
            vote_type: type
          }, { onConflict: 'user_id, deal_id' })

         if (error) throw error
      }

    } catch (error) {
      console.error('Error al votar:', error)
      alert('Error al registrar el voto')
      // Revert optimistic update
      setVotes(previousCount)
      setUserVote(previousVote)
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando oferta...</div>
  }

  if (!deal) {
    return <div className="p-8 text-center text-zinc-500">Oferta no encontrada</div>
  }

  // Calculate discount
  const originalPrice = Number(deal.original_price) || 0
  const dealPrice = Number(deal.deal_price) || 0
  
  const discount = originalPrice > 0
    ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
    : 0

  const imageUrl = dealImages.length > 0 ? dealImages[currentImageIndex] : '/placeholder.jpg'
  const categoryName = deal.category?.name || 'Oferta'
  const userName = deal.user?.username || 'Usuario'
  const userAvatar = deal.user?.avatar_url
  const dealUrl = deal.deal_url || '#'

  // Expiration logic
  const expiresAt = deal.expires_at ? new Date(deal.expires_at) : null
  const isExpired = expiresAt ? new Date() > expiresAt : false
  const latitude = deal.latitude
  const longitude = deal.longitude
  
  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12 px-4 sm:px-6">
       {/* Back button */}
       <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors group text-sm">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Volver a ofertas
       </Link>

       <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Right Column: Info (4 cols) - Mobile: Order 2, Desktop: Order 2 (Right) */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-2">
             <div className="glass-panel rounded-2xl lg:sticky lg:top-24 border border-white/5 flex flex-col md:flex-row overflow-hidden">
                
                {/* Main Content Info */}
                <div className="flex-1 p-5 space-y-4 min-w-0">
                   <div>
                      <div className="flex items-center gap-2 text-[10px] text-[#2BD45A] font-bold tracking-wider mb-2 uppercase">
                         <Tag className="w-3 h-3" />
                         {categoryName}
                      </div>
                      
                      <h1 className="text-xl md:text-2xl font-bold text-white leading-tight mb-3">
                         {deal.title}
                      </h1>
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-black/20 p-3 rounded-xl border border-white/5">
                         <div className="flex flex-col min-w-0">
                            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
                               ${dealPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            {originalPrice > 0 && (
                               <span className="text-xs md:text-sm text-zinc-500 line-through">
                                  ${originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                               </span>
                            )}
                         </div>
                         
                         {/* Discount Badge moved here */}
                         {discount > 0 && (
                            <div className="bg-[#2BD45A] text-black px-2.5 py-1 rounded-lg font-black text-xs md:text-sm shadow-lg shadow-[#2BD45A]/20 transform -rotate-2">
                               -{discount}%
                            </div>
                         )}
                      </div>

                      {isExpired ? (
                         <div className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl cursor-not-allowed border border-white/5 text-sm">
                            <AlertCircle className="w-4 h-4" /> Oferta Expirada
                         </div>
                      ) : (
                         <a
                             href={dealUrl}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="w-full flex items-center justify-center gap-2 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 hover:shadow-[#2BD45A]/40 hover:-translate-y-0.5 text-sm md:text-base"
                         >
                             Ir a la oferta <ExternalLink className="w-4 h-4" />
                         </a>
                      )}
                   </div>

                   <div className="pt-4 border-t border-white/5 space-y-3">
                      {/* Location Map */}
                      {latitude && longitude && (
                         <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                               <MapPin className="w-3 h-3" /> Ubicación
                            </div>
                            <Map position={[latitude, longitude]} readonly />
                         </div>
                      )}

                      {/* Expiration Date */}
                      {expiresAt && (
                         <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg border ${
                            isExpired 
                              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                              : 'bg-[#2BD45A]/10 border-[#2BD45A]/20 text-[#2BD45A]'
                         }`}>
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">
                               {isExpired ? 'Expiró el: ' : 'Válido hasta: '} 
                               {expiresAt.toLocaleDateString()}
                            </span>
                         </div>
                      )}

                      <div className="flex items-center justify-between text-sm gap-2">
                         <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                            <div className="shrink-0 w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden ring-2 ring-black">
                               {userAvatar ? (
                                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                               ) : (
                                  <span className="font-bold text-zinc-400 text-xs">{userName?.[0] || 'U'}</span>
                               )}
                            </div>
                            <div className="flex flex-col min-w-0 overflow-hidden">
                               <span className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">Publicado por</span>
                               <span className="text-white font-medium text-xs md:text-sm truncate">{userName}</span>
                            </div>
                         </div>
                         
                         {/* Edit Button if owner */}
                         {deal.user_id && currentUserId === deal.user_id && (
                           <Link 
                              href={`/oferta/${id}/edit`}
                              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Editar oferta"
                           >
                              <Edit2 className="w-3.5 h-3.5" />
                           </Link>
                         )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-white/5 p-2 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span>Publicado el {new Date(deal.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>

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

                   <div className="pt-3">
                      <button className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white py-2 transition-colors text-xs font-medium hover:bg-white/5 rounded-lg">
                         <Share2 className="w-3.5 h-3.5" /> Compartir oferta
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Left Column: Image & Comments (8 cols) - Mobile: Order N/A (contents), Desktop: Order 1 (Left) */}
          <div className="contents lg:block lg:col-span-8 lg:space-y-4 lg:order-1">
             <div className="glass-panel p-4 relative group overflow-hidden rounded-2xl order-1 flex flex-col gap-3">
                
                {/* Countdown Banner - Moved to top to avoid overlap */}
                {timeLeft && !isExpired && (
                   <div className="w-full bg-[#2BD45A]/10 border border-[#2BD45A]/20 text-[#2BD45A] py-2 px-3 rounded-xl flex items-center justify-center gap-4 backdrop-blur-sm">
                       <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                           <Clock className="w-3.5 h-3.5" />
                           <span className="hidden sm:inline">Termina en:</span>
                       </div>
                       <div className="flex gap-2 font-black text-xs font-mono text-white">
                           <div className="flex flex-col items-center leading-none">
                               <span>{timeLeft.days}</span>
                               <span className="text-[8px] font-normal opacity-60">DÍAS</span>
                           </div>
                           <span>:</span>
                           <div className="flex flex-col items-center leading-none">
                               <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
                               <span className="text-[8px] font-normal opacity-60">HRS</span>
                           </div>
                           <span>:</span>
                           <div className="flex flex-col items-center leading-none">
                               <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
                               <span className="text-[8px] font-normal opacity-60">MIN</span>
                           </div>
                           <span>:</span>
                           <div className="flex flex-col items-center leading-none">
                               <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
                               <span className="text-[8px] font-normal opacity-60">SEG</span>
                           </div>
                       </div>
                   </div>
                )}

                <div className="flex flex-col md:flex-row gap-3 relative">
                   {/* Voting Sidebar - Moved to side to avoid overlap */}
                   <div className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-2 w-full md:w-14 bg-black/20 border border-white/5 rounded-xl py-3 px-4 md:px-0 backdrop-blur-sm shrink-0 order-2 md:order-1">
                      <button 
                        onClick={() => handleVote('hot')}
                        className={cn(
                          "p-2 rounded-xl transition-all hover:scale-110 active:scale-95 hover:bg-white/10",
                          userVote === 'hot' ? "text-[#2BD45A]" : "text-zinc-500"
                        )}
                      >
                        <ArrowUp className="w-5 h-5" strokeWidth={3} />
                      </button>
                      
                      <div className="flex flex-col items-center gap-0.5 min-w-[3ch] text-center">
                          <Flame 
                              className={cn(
                                  "transition-colors w-4 h-4 mb-0.5",
                                  userVote === 'hot' ? "text-[#2BD45A] fill-[#2BD45A]" :
                                  userVote === 'cold' ? "text-blue-500 fill-blue-500" : "text-zinc-600"
                              )} 
                          />
                          <span className={cn(
                              "font-black text-xs md:text-sm",
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
                        <ArrowDown className="w-5 h-5" strokeWidth={3} />
                      </button>
                   </div>
                   
                   {/* Image Container */}
                   <div className="relative flex-1 rounded-xl overflow-hidden bg-zinc-900/50 flex items-center justify-center min-h-[300px] md:min-h-[400px] aspect-video group/image order-1 md:order-2 border border-white/5">
                      <img
                          src={imageUrl}
                          alt={deal.title}
                          className="object-contain w-full h-full p-2 transition-transform duration-300 group-hover/image:scale-105"
                          onClick={() => setIsLightboxOpen(true)}
                      />
                      
                      {/* Zoom Button */}
                      <button 
                        onClick={() => setIsLightboxOpen(true)}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/80 z-20"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      {/* Carousel Controls */}
                      {hasMultipleImages && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-20 opacity-0 group-hover/image:opacity-100"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-20 opacity-0 group-hover/image:opacity-100"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          
                          {/* Dots Indicator */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                            {dealImages.map((_: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-all",
                                  idx === currentImageIndex ? "bg-[#2BD45A] w-3" : "bg-white/50 hover:bg-white/80"
                                )}
                              />
                            ))}
                          </div>
                        </>
                      )}
                   </div>
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div className="flex gap-2.5 overflow-x-auto py-1 px-1 scrollbar-hide">
                    {dealImages.map((url: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                          idx === currentImageIndex ? "border-[#2BD45A] ring-2 ring-[#2BD45A]/20" : "border-transparent opacity-60 hover:opacity-100 bg-zinc-900"
                        )}
                      >
                        <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
             </div>

             {/* Lightbox Modal */}
             {isLightboxOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <button 
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  
                  <div className="relative w-full h-full max-w-7xl flex items-center justify-center">
                    <img 
                      src={imageUrl} 
                      alt={deal.title} 
                      className="max-w-full max-h-full object-contain"
                    />
                    
                    {hasMultipleImages && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-12 h-12" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-12 h-12" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 font-medium">
                    {currentImageIndex + 1} / {dealImages.length}
                  </div>
                </div>
             )}

             <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/5 order-3">
                <CommentsSection dealId={id} />
             </div>
          </div>
       </div>
    </div>
  )
}
