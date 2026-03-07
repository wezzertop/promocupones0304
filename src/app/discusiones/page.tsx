import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { MessageSquare } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import GenericBanner from '@/components/GenericBanner'

export const dynamic = 'force-dynamic'

export default async function DiscusionesPage() {
  const supabase = await createClient()

  // Fetch deals with relations
  const { data: dealsData, error } = await (supabase.from('deals') as any)
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('status', 'active')
    .eq('deal_type', 'discussion')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
  }

  const deals = dealsData?.map((deal: any) => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <GenericBanner 
        id="all_discussions"
        title={
          <>
            Conversaciones <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
              de la comunidad
            </span>
          </>
        }
        description="Pregunta, responde y comparte opiniones sobre productos y tiendas."
        iconName="MessageSquare"
        iconLabel="Discusiones"
        iconColorClass="text-cyan-500"
        iconBgClass="bg-cyan-500/10"
        iconBorderClass="border-cyan-500/20"
        glowColorClass="bg-cyan-500"
      />

      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal: any) => (
            // @ts-ignore
            <DealCard key={deal.id} deal={deal as unknown as Deal} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay discusiones activas</h3>
            <p className="text-gray-400 max-w-md mb-6">
              Inicia un tema nuevo y comienza a charlar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
