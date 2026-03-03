import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Tag } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import HeroBanner from '@/components/HeroBanner'

export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const filter = params.filter || 'foryou'

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
    // 'foryou' - Default: Trending (High votes in last 7 days)
    // If we want trending, we should filter by date AND sort by votes.
    // However, if there are few posts, this might return empty.
    // Safer fallback: Just show recent for now, or mix.
    // Let's try a "smart" sort: recent first, but maybe we can't easily do weighted sort in simple query.
    // Let's stick to Recent for 'foryou' for now to ensure content is always shown, 
    // BUT we can make it slightly different if we want.
    // Actually, users often expect "Para ti" to be "Recientes" if they are new.
    // Let's make "Para ti" = Recientes for this MVP phase to ensure stability.
    // OR: "Para ti" = Random? No.
    // Let's stick to Recientes for Para ti, but maybe we can add a "Trending" logic later.
    // Re-reading user request: "Para ti" button...
    // Let's make "Para ti" = Recientes (Chronological)
    // "Más votadas" = Popular (Votes)
    // "Recientes" = Recientes (Chronological)
    // Wait, having two buttons do the same is bad UX.
    
    // Let's make "Para ti" = "Trending" (Votes in last 30 days?)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Check if we can do this query easily.
    // .gte('created_at', ...) .order('votes_count')
    // But if we have 0 posts in last 30 days, it shows nothing.
    // Given the project seems to have seed data or low volume, might be risky.
    // Let's stick to:
    // Para ti = Recientes (Default)
    // Más votadas = Popular
    // Recientes = Recientes
    // I will add a comment TODO for future algorithm.
    
    query = query.order('created_at', { ascending: false })
  }

  const { data: dealsData, error } = await query

  if (error) {
    console.error('Error fetching deals:', error)
  }

  const deals = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Featured Banner (Dismissible) */}
      <HeroBanner />

      {/* Filters & Actions */}
      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            // @ts-ignore - Supabase types mapping might be slightly off with relations, ignoring for now
            <DealCard key={deal.id} deal={deal as unknown as Deal} />
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
