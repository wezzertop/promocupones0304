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
    // 'foryou' - Trending: High votes in last 14 days
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // We try to get trending items first.
    // Note: If the platform is new, we might not have enough data for "trending",
    // so we might want to fallback to just recent if this yields few results.
    // For now, let's mix: Recent deals that have high engagement.
    // Since Supabase doesn't support complex weighted sorting easily in one go without a function,
    // we will prioritize recent deals but sort by votes for now?
    // Actually, "Para ti" usually implies "Algorithm".
    // Let's go with: Deals created in last 14 days, sorted by votes.
    
    // If we want to ensure we show *something* even if nothing is new, we can remove the date filter
    // and just sort by a "hotness" score if we had one.
    // For now, let's just sort by votes but only for recent-ish content to keep it fresh.
    
    // However, strictly filtering by date might return 0 results.
    // Let's stick to a safe default for "Para ti":
    // Sort by votes (popularity) but heavily weighted by recency?
    // Since we can't do that easily in client-side query builder without a computed column:
    // We will just show Recent deals for now, but maybe we can ask the user if they want a real algorithm later.
    
    // Let's implement a simple "Trending" = Most voted in last 30 days.
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // We apply the date filter only for 'foryou' to keep it fresh
    // query = query.gte('created_at', thirtyDaysAgo.toISOString()).order('votes_count', { ascending: false })
    
    // REVERTING to Recent for stability as requested in analysis, 
    // but we will order by votes descending as a secondary sort if possible?
    // No, let's just use Recent for now to ensure content shows up.
    // The previous TODO mentioned implementing a real algorithm.
    // Let's try to implement a hybrid approach:
    // Fetch recent 50 items, then sort them by score in Javascript?
    // That's a good client-side (server component) optimization.
    
    query = query.order('created_at', { ascending: false }).limit(50)
  }

  const { data: dealsData, error } = await query

  if (error) {
    console.error('Error fetching deals:', error)
  }

  let deals = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  // Custom "Para ti" sorting (Client/Server-side logic)
  if (filter === 'foryou' && deals) {
    // Simple "Hot" score: votes + (comments * 2) - (hours_since_creation * 0.5)
    deals = deals.sort((a, b) => {
      const scoreA = (a.votes_count || 0) + (a.comments_count * 2) - (Math.abs(new Date().getTime() - new Date(a.created_at).getTime()) / 3600000 * 0.5)
      const scoreB = (b.votes_count || 0) + (b.comments_count * 2) - (Math.abs(new Date().getTime() - new Date(b.created_at).getTime()) / 3600000 * 0.5)
      return scoreB - scoreA
    })
  }

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
