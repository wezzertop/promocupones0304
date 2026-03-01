import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Sparkles, Tag } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'

export default async function Home() {
  const supabase = await createClient()

  // Fetch deals with relations
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
  }

  const deals = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Featured Banner (Optional, keeping it minimal) */}
      <div className="bg-gradient-to-r from-[#18191c] to-[#222327] rounded-3xl p-8 border border-[#2d2e33] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2BD45A] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2BD45A]/10 text-[#2BD45A] text-xs font-bold uppercase tracking-wider mb-4 border border-[#2BD45A]/20">
            <Sparkles size={14} />
            Comunidad Oficial
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Descubre ofertas reales <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2BD45A] to-emerald-400">
              compartidas por gente como tú
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg">
            Únete a la comunidad de ahorradores más inteligente. Vota, comenta y comparte las mejores promociones de internet.
          </p>
        </div>
      </div>

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
