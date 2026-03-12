import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import FeedAd from '@/components/FeedAd'
import { Deal } from '@/types'
import { Flame } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import GenericBanner from '@/components/GenericBanner'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'

export default async function HotPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const pageSize = 20

  // Fetch deals with relations, ordered by votes_count DESC
  const now = new Date().toISOString()
  
  // Get Total Count
  const { count: totalCount } = await (supabase.from('deals') as any)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  const { data: dealsData, error } = await (supabase.from('deals') as any)
    .select(`
      *,
      store:stores(*),
      user:users!deals_user_id_fkey(id, username, avatar_url),
      category:categories(*),
      comments(count)
    `)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('votes_count', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (error) {
    console.error('Error fetching hot deals:', error)
  }

  const deals = dealsData?.map((deal: any) => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <GenericBanner 
        id="hot_deals"
        title={
          <>
            Las ofertas más <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              votadas por la comunidad
            </span>
          </>
        }
        description="Estas son las ofertas que están ardiendo ahora mismo. ¡No te las pierdas antes de que se agoten!"
        iconName="Flame"
        iconLabel="Lo más Hot"
        iconColorClass="text-orange-500"
        iconBgClass="bg-orange-500/10"
        iconBorderClass="border-orange-500/20"
        glowColorClass="bg-orange-500"
      />

      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Top Ad */}
      <FeedAd className="my-6" />

      {/* Main Grid */}
      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          <>
            {deals.map((deal: any, index: number) => (
              <div key={deal.id}>
                  {/* @ts-ignore */}
                  <DealCard deal={deal as unknown as Deal} />
                  {(index + 1) % 5 === 0 && (
                    <FeedAd key={`ad-${deal.id}`} variant="banner2" className="mt-4" />
                  )}
              </div>
            ))}
            
            <Pagination 
              totalPages={totalPages} 
              currentPage={currentPage} 
            />
          </>
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
