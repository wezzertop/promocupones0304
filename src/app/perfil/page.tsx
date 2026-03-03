import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Settings, User, MapPin, Calendar, Flame, MessageSquare, Tag, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getUserGamificationProfile, getUserBadges, getAllBadges } from '@/lib/gamification'
import LevelProgress from '@/components/gamification/LevelProgress'
import BadgeList from '@/components/gamification/BadgeList'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Get current user session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // 2. Fetch user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: any, error: any }

  // Fetch gamification data
  const gamificationProfile = await getUserGamificationProfile(session.user.id)
  const userBadges = await getUserBadges(session.user.id)
  const allBadges = await getAllBadges()

  // 3. Fetch user's deals
  const { data: userDeals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (dealsError) {
    console.error('Error fetching user deals:', dealsError)
  }

  const deals = userDeals?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  // Calculate stats
  const totalDeals = deals?.length || 0
  const totalVotes = deals?.reduce((acc, deal) => acc + (deal.votes_count || 0), 0) || 0
  
  // Identify pending/rejected deals
  const pendingDealsCount = deals?.filter((d: any) => ['pending', 'rejected', 'revision'].includes(d.status)).length || 0

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-[100vw] overflow-x-hidden">
      {/* Profile Header Card */}
      <div className="bg-[#18191c] border border-[#2d2e33] rounded-3xl overflow-hidden relative mx-auto max-w-5xl">
        {/* Banner Background */}
        <div className="h-32 bg-gradient-to-r from-[#2BD45A]/20 to-emerald-900/20 w-full absolute top-0 left-0 z-0"></div>
        
        <div className="relative z-10 px-6 pb-6 pt-16 md:px-10 md:pt-20 flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-[#18191c] bg-[#222327] overflow-hidden shadow-xl">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.username || 'Usuario'} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#2BD45A] bg-[#2BD45A]/10 text-4xl font-bold">
                  {profile?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <Link 
              href="/ajustes"
              className="absolute bottom-1 right-1 p-2 bg-[#222327] border border-[#2d2e33] rounded-full text-gray-400 hover:text-white hover:border-[#2BD45A] transition-all shadow-lg"
              title="Editar perfil"
            >
              <Settings size={16} />
            </Link>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl font-bold text-white mb-1">
              {profile?.username || 'Usuario sin nombre'}
            </h1>
            <p className="text-gray-400 text-sm mb-4 flex items-center justify-center md:justify-start gap-2">
              <Calendar size={14} />
              Miembro desde {formatDistanceToNow(new Date(profile?.created_at || session.user.created_at || new Date()), { addSuffix: true, locale: es })}
            </p>

            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="px-4 py-2 rounded-xl bg-[#222327] border border-[#2d2e33] flex items-center gap-2">
                <Tag size={16} className="text-blue-500" />
                <span className="font-bold text-white">{totalDeals}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Publicaciones</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#222327] border border-[#2d2e33] flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <span className="font-bold text-white">{totalVotes}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Karma Total</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
             <Link 
                href="/publicar" 
                className="w-full md:w-auto px-6 py-3 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 text-center flex items-center justify-center gap-2"
             >
                <Tag size={18} />
                Nueva Publicación
             </Link>
          </div>
        </div>
      </div>

      {/* Pending Deals Notification Section */}
      {pendingDealsCount > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Tienes {pendingDealsCount} {pendingDealsCount === 1 ? 'publicación' : 'publicaciones'} en proceso
              </h3>
              <p className="text-gray-400 text-sm">
                Algunas de tus ofertas están pendientes de aprobación o requieren cambios.
              </p>
            </div>
          </div>
          <Link 
            href="/mis-publicaciones"
            className="w-full md:w-auto px-6 py-3 bg-[#222327] hover:bg-[#2d2e33] text-white font-medium rounded-xl border border-[#2d2e33] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            Ver estado detallado
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Gamification Section */}
      {gamificationProfile && (
        <div className="grid grid-cols-1 gap-6">
          <LevelProgress profile={gamificationProfile} />
          {allBadges && allBadges.length > 0 && userBadges && (
            <BadgeList badges={allBadges} userBadges={userBadges} />
          )}
        </div>
      )}

      {/* Content Tabs (Visual only for now) */}
      <div className="flex items-center gap-1 border-b border-[#2d2e33] pb-1 overflow-x-auto scrollbar-hide">
        <Link 
          href="/mis-publicaciones"
          className="px-6 py-3 text-sm font-bold text-white border-b-2 border-[#2BD45A] bg-[#2BD45A]/5 rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 shrink-0"
        >
          Gestionar Publicaciones
          <ExternalLink size={14} />
        </Link>
        <button className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
          Guardados
        </button>
        <button className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
          Comentarios
        </button>
      </div>

      {/* User Deals Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            // @ts-ignore
            <DealCard key={deal.id} deal={deal as unknown as Deal} />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aún no has publicado nada</h3>
            <p className="text-gray-400 max-w-md mb-6">
              ¡Comparte tu primera oferta con la comunidad y empieza a ganar karma!
            </p>
            <Link 
                href="/publicar"
                className="px-6 py-3 bg-[#222327] hover:bg-[#2d2e33] text-white font-medium rounded-xl transition-colors border border-[#2d2e33]"
            >
              Publicar ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
