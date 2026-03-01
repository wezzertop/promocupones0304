import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Flame, Tag } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'

export const dynamic = 'force-dynamic'

export default async function HotPage() {
  const supabase = await createClient()

  // Fetch deals with relations, ordered by votes_count DESC
  const { data: dealsData, error } = await supabase
    .from('deals')
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('status', 'active')
    .order('votes_count', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching hot deals:', error)
  }

  const deals = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#18191c] to-[#222327] rounded-3xl p-8 border border-[#2d2e33] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider mb-4 border border-orange-500/20">
            <Flame size={14} />
            Lo más Hot
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Las ofertas más <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              votadas por la comunidad
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg">
            Estas son las ofertas que están ardiendo ahora mismo. ¡No te las pierdas antes de que se agoten!
          </p>
        </div>
      </div>

      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            // @ts-ignore
            <DealCard key={deal.id} deal={deal as unknown as Deal} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Flame size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay ofertas hot por el momento</h3>
            <p className="text-gray-400 max-w-md mb-6">
              Vota por tus ofertas favoritas para que aparezcan aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
