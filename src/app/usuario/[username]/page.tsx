import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Flame, 
  MessageSquare, 
  Shield, 
  CheckCircle,
  Trophy,
  Star
} from 'lucide-react'
import ReputationButton from '@/components/ReputationButton'
import DealCard from '@/components/DealCard'
import ProfileAd from '@/components/ProfileAd'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const supabase = await createClient()

  // 1. Get current user session (to check if they can give points)
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  // 2. Fetch profile user data
  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      *,
      gamification_profiles!gamification_profiles_user_id_fkey(*),
      deals!deals_user_id_fkey(count),
      comments(count),
      votes(count)
    `)
    .ilike('username', decodedUsername)
    .maybeSingle() as { data: any, error: any }

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    notFound()
  }

  // 3. Fetch user's deals (active only for public view usually, but let's show all for now or approved)
  const { data: userDeals } = await supabase
    .from('deals')
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('user_id', profile.id)
    .eq('status', 'active') // Only show active deals
    .order('created_at', { ascending: false })
    .limit(10)

  // 4. Check reputation status
  let hasGivenReputation = false
  let currentUserPoints = 0

  if (currentUserId) {
    // Check if already given
    const { data: transfer } = await supabase
      .from('reputation_transfers')
      .select('id')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', profile.id)
      .single()
    
    if (transfer) {
      hasGivenReputation = true
    }

    // Get current user points balance
    const { data: currentUser } = await supabase
      .from('users')
      .select('karma_points')
      .eq('id', currentUserId)
      .single() as { data: any, error: any }
      
    currentUserPoints = currentUser?.karma_points || 0
  }

  const deals = userDeals?.map((deal: any) => ({
    ...deal,
    comments_count: deal.comments?.[0]?.count || 0
  })) || []

  // Stats
  const totalDeals = profile.deals?.[0]?.count || 0
  const totalComments = profile.comments?.[0]?.count || 0
  const totalVotes = profile.votes?.[0]?.count || 0
  const level = profile.gamification_profiles?.current_level || 1

  return (
    <div className="min-h-screen bg-[#0e0f11] pb-20">
      {/* Banner / Header Background */}
      <div className="h-48 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-white/5 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Column: Profile Card */}
          <div className="w-full md:w-80 flex-shrink-0 space-y-6">
            <div className="bg-[#18191c] rounded-2xl border border-white/5 p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
              {/* Avatar */}
              <div className="relative w-32 h-32 rounded-full border-4 border-[#18191c] shadow-2xl mx-auto md:mx-0 mb-4">
                <Image
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
                  alt={profile.username}
                  fill
                  className="object-cover rounded-full"
                />
                <div className="absolute bottom-0 right-0 bg-[#18191c] rounded-full p-1">
                  <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Trophy size={10} />
                    Lvl {level}
                  </div>
                </div>
              </div>

              {/* Identity */}
              <div className="text-center md:text-left mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                  {profile.username}
                  {profile.role === 'verified' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  {profile.role === 'admin' && <Shield className="w-5 h-5 text-red-500" />}
                </h1>
                <p className="text-zinc-500 text-sm mt-1 flex items-center justify-center md:justify-start gap-2">
                  <Calendar size={14} />
                  Miembro desde {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>

              {/* Reputation Action */}
              <div className="mb-6 flex justify-center md:justify-start">
                <ReputationButton 
                  receiverId={profile.id}
                  receiverUsername={profile.username}
                  currentUserId={currentUserId}
                  hasAlreadyGiven={hasGivenReputation}
                  userPoints={currentUserPoints}
                />
              </div>

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{profile.karma_points}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Reputación</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{totalDeals}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Ofertas</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{totalComments}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Comentarios</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{totalVotes}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Votos</div>
                </div>
              </div>
            </div>

            {/* Sidebar Ad (Under Profile Card) */}
            <div className="flex justify-center">
               <ProfileAd variant="sidebar" className="bg-[#18191c]/50 rounded-2xl border border-white/5 p-4 w-full flex justify-center" />
            </div>

            {/* Badges Placeholder (if we had badges data) */}
            {/* <div className="bg-[#18191c] rounded-2xl border border-white/5 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Medal size={18} className="text-yellow-500" />
                Insignias
              </h3>
              <div className="flex flex-wrap gap-2">
                ... badges ...
              </div>
            </div> */}
          </div>

          {/* Right Column: Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Flame className="text-orange-500" />
              Ofertas Publicadas
            </h2>

            {deals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {deals.map((deal: any, index: number) => (
                  <div key={deal.id}>
                    <DealCard deal={deal} />
                    {/* Insert Ad every 4 cards (after 4th, 8th, etc.) */}
                    {(index + 1) % 4 === 0 && (
                        <ProfileAd variant="feed" className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#18191c] rounded-2xl border border-white/5 p-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Sin ofertas activas</h3>
                <p className="text-zinc-500">
                  {profile.username} no tiene ofertas activas en este momento.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
