import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import FeedAd from '@/components/FeedAd'
import { Deal } from '@/types'
import { Tag } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import GenericBanner from '@/components/GenericBanner'

export const dynamic = 'force-dynamic'

export default async function DealsPage() {
  const supabase = await createClient()

  // Fetch deals with relations
  const now = new Date().toISOString()
  const { data: dealsData, error } = await (supabase.from('deals') as any)
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('status', 'active')
    .eq('deal_type', 'deal')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
  }

  const deals = dealsData?.map((deal: any) => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <GenericBanner 
        id="all_deals"
        title={
          <>
            Encuentra los mejores <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              precios y descuentos
            </span>
          </>
        }
        description="Explora todas las ofertas publicadas por nuestra comunidad y ahorra en tus compras diarias."
        iconName="Tag"
        iconLabel="Ofertas"
        iconColorClass="text-blue-500"
        iconBgClass="bg-blue-500/10"
        iconBorderClass="border-blue-500/20"
        glowColorClass="bg-blue-500"
      />

      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Top Ad */}
      <FeedAd className="my-6" />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal: any, index: number) => (
            <div key={deal.id}>
                {/* @ts-ignore */}
                <DealCard deal={deal as unknown as Deal} />
                {(index + 1) % 5 === 0 && (
                  <FeedAd key={`ad-${deal.id}`} variant="banner2" className="mt-4" />
                )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay ofertas disponibles</h3>
            <p className="text-gray-400 max-w-md mb-6">
              ¡Sé el primero en compartir una gran oferta!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
