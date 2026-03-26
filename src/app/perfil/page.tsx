import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Settings, User, MapPin, Calendar, Flame, MessageSquare, Tag, AlertCircle, ArrowRight, ExternalLink, BellRing } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getUserGamificationProfile, getUserBadges, getAllBadges } from '@/lib/gamification'
import LevelProgress from '@/components/gamification/LevelProgress'
import BadgeList from '@/components/gamification/BadgeList'
import ProfileTabs from '@/components/ProfileTabs'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const pageSize = 10

  // 1. Get current user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 2. Fetch user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any, error: any }

  // Use metadata picture as fallback if profile avatar_url is missing
  const profileAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture

  // Fetch gamification data
  const gamificationProfile = await getUserGamificationProfile(user.id)
  const userBadges = await getUserBadges(user.id)
  const allBadges = await getAllBadges()

  // 3. Get total count for pagination
  const { count: totalDealsCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const totalPages = Math.ceil((totalDealsCount || 0) / pageSize)

  // 4. Fetch user's deals with pagination
  const { data: userDeals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (dealsError) {
    console.error('Error fetching user deals:', dealsError)
  }

  const deals = userDeals?.map((deal: any) => ({
    ...deal,
    comments_count: deal.comments?.[0]?.count || 0
  })) as Deal[]

  // Calculate stats (we need the total, not just the paginated ones)
  const totalDeals = totalDealsCount || 0
  const { data: karmaData } = await supabase.from('deals').select('votes_count').eq('user_id', user.id)
  const totalVotes = karmaData?.reduce((acc, deal: any) => acc + (deal.votes_count || 0), 0) || 0
  
  // Identify pending/rejected deals
  const { count: pendingDealsCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'rejected', 'revision'])

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-[100vw] overflow-x-hidden">
      {/* Profile Header Card */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden relative mx-auto max-w-5xl">
        {/* Banner Background */}
        <div className="h-32 bg-gradient-to-r from-[#07B5A7]/20 to-emerald-900/20 w-full absolute top-0 left-0 z-0"></div>
        
        <div className="relative z-10 px-6 pb-6 pt-16 md:px-10 md:pt-20 flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-surface bg-surface-hover overflow-hidden shadow-xl relative">
              {profileAvatar ? (
                <Image 
                  src={profileAvatar} 
                  alt={profile?.username || 'Usuario'} 
                  fill 
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#07B5A7] bg-[#07B5A7]/10 text-4xl font-bold rounded-full">
                  {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <Link 
              href="/ajustes"
              className="absolute bottom-1 right-1 p-2 bg-surface-hover border border-border rounded-full text-zinc-500 dark:text-gray-400 hover:text-foreground hover:border-[#07B5A7] transition-all shadow-lg"
              title="Editar perfil"
            >
              <Settings size={16} />
            </Link>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {profile?.username || 'Usuario sin nombre'}
            </h1>
            <p className="text-zinc-500 dark:text-gray-400 text-sm mb-4 flex items-center justify-center md:justify-start gap-2">
              <Calendar size={14} />
              Miembro desde {formatDistanceToNow(new Date(profile?.created_at || user.created_at || new Date()), { addSuffix: true, locale: es })}
            </p>

            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="px-4 py-2 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
                <Tag size={16} className="text-blue-500" />
                <span className="font-bold text-foreground">{totalDeals}</span>
                <span className="text-xs text-zinc-500 dark:text-gray-400 uppercase tracking-wider font-medium">Publicaciones</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <span className="font-bold text-foreground">{totalVotes}</span>
                <span className="text-xs text-zinc-500 dark:text-gray-400 uppercase tracking-wider font-medium">Karma Total</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
             <Link 
                href="/publicar" 
                className="w-full md:w-auto px-6 py-3 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#07B5A7]/20 text-center flex items-center justify-center gap-2"
             >
                <Tag size={18} />
                Nueva Publicación
             </Link>
             <Link 
                href="/perfil/alertas" 
                className="w-full md:w-auto px-6 py-3 bg-surface-hover hover:bg-black/5 dark:hover:bg-[#2d2e33] text-foreground font-bold rounded-xl border border-border transition-all text-center flex items-center justify-center gap-2"
             >
                <BellRing size={18} />
                Mis Alertas
             </Link>
          </div>
        </div>
      </div>

      {/* Pending Deals Notification Section */}
      {(pendingDealsCount || 0) > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Tienes {pendingDealsCount} {pendingDealsCount === 1 ? 'publicación' : 'publicaciones'} en proceso
              </h3>
              <p className="text-zinc-500 dark:text-gray-400 text-sm">
                Algunas de tus ofertas están pendientes de aprobación o requieren cambios.
              </p>
            </div>
          </div>
          <Link 
            href="/mis-publicaciones"
            className="w-full md:w-auto px-6 py-3 bg-surface-hover hover:bg-black/5 dark:hover:bg-[#2d2e33] text-foreground font-medium rounded-xl border border-border flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
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

      {/* Content Tabs (Functional) */}
      <ProfileTabs />

      {/* User Deals Grid */}
      <div className="flex flex-col items-center md:items-stretch gap-4 p-1">
        {deals && deals.length > 0 ? (
          <>
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
            
            <Pagination 
              totalPages={totalPages} 
              currentPage={currentPage} 
            />
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-surface rounded-3xl border border-border border-dashed">
            <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Aún no has publicado nada</h3>
            <p className="text-zinc-500 dark:text-gray-400 max-w-md mb-6">
              ¡Comparte tu primera oferta con la comunidad y empieza a ganar karma!
            </p>
            <Link 
                href="/publicar"
                className="px-6 py-3 bg-surface-hover hover:bg-black/5 dark:hover:bg-[#2d2e33] text-foreground font-medium rounded-xl transition-colors border border-border"
            >
              Publicar ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
