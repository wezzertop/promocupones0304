import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal, DealWithRelations } from '@/types'
import { Tag } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import HeroBanner from '@/components/HeroBanner'

export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const filter = params.filter || 'foryou'

  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date().toISOString()
  let query = supabase
    .from('deals')
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  // Apply filters
  if (filter === 'popular') {
    query = query.order('votes_count', { ascending: false })
  } else if (filter === 'recent') {
    query = query.order('created_at', { ascending: false })
  } else {
    // 'foryou' logic - default to recent with limit for now
    query = query.order('created_at', { ascending: false }).limit(50)
  }

  const { data: dealsData, error } = await query

  if (error) {
    console.error('Error fetching deals:', error)
  }

  let deals: DealWithRelations[] = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  })) || []

  // Fetch User Interactions (Votes & Saves) in Batch if User is Logged In
  if (user && deals.length > 0) {
    const dealIds = deals.map(d => d.id)

    const [votesResult, savesResult] = await Promise.all([
      supabase.from('votes').select('deal_id, vote_type').eq('user_id', user.id).in('deal_id', dealIds),
      supabase.from('saves').select('deal_id').eq('user_id', user.id).in('deal_id', dealIds)
    ])

    const userVotes = new Map(votesResult.data?.map(v => [v.deal_id, v.vote_type]) || [])
    const userSaves = new Set(savesResult.data?.map(s => s.deal_id) || [])

    deals = deals.map(deal => ({
      ...deal,
      user_vote: userVotes.get(deal.id) as 'hot' | 'cold' | null,
      is_saved: userSaves.has(deal.id)
    }))
  }

  // Custom "Para ti" sorting (Client/Server-side logic)
  if (filter === 'foryou' && deals.length > 0) {
    // Simple "Hot" score: votes + (comments * 2) - (hours_since_creation * 0.5)
    deals = deals.sort((a, b) => {
      const scoreA = (a.votes_count || 0) + ((a.comments_count || 0) * 2) - (Math.abs(new Date().getTime() - new Date(a.created_at).getTime()) / 3600000 * 0.5)
      const scoreB = (b.votes_count || 0) + ((b.comments_count || 0) * 2) - (Math.abs(new Date().getTime() - new Date(b.created_at).getTime()) / 3600000 * 0.5)
      return scoreB - scoreA
    })
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Featured Banner (Dismissible) */}
      <HeroBanner />

      {/* Filters & Actions */}
      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              initialUserVote={deal.user_vote || null}
              initialIsSaved={deal.is_saved || false}
            />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay ofertas por el momento</h3>
            <p className="text-gray-400 max-w-md mb-6">
              Parece que todo está tranquilo hoy. ¡Sé el héroe que necesitamos y publica la primera oferta del día!
            </p>
            <button className="px-6 py-3 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-colors shadow-lg shadow-[#2BD45A]/20">
              Publicar Oferta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
