import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import FeedAd from '@/components/FeedAd'
import { Deal } from '@/types'
import { Ticket } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import GenericBanner from '@/components/GenericBanner'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'

export default async function CuponesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const pageSize = 20

  // Fetch deals with relations
  const now = new Date().toISOString()
  
  // Get Total Count
  const { count: totalCount } = await (supabase.from('deals') as any)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('deal_type', 'coupon')
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
    .eq('deal_type', 'coupon')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

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
        id="all_coupons"
        title={
          <>
            Códigos y Cupones <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              verificados
            </span>
          </>
        }
        description="Ahorra extra en tus compras con los códigos de descuento más recientes."
        iconName="Ticket"
        iconLabel="Cupones"
        iconColorClass="text-purple-500"
        iconBgClass="bg-purple-500/10"
        iconBorderClass="border-purple-500/20"
        glowColorClass="bg-purple-500"
      />

      <HomeFilters dealsCount={deals?.length || 0} />

      {/* Top Ad */}
      <FeedAd className="my-6" />

      {/* Main Grid */}
      <div className="flex flex-col items-center md:items-stretch gap-4">
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
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-surface rounded-3xl border border-border border-dashed">
            <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Ticket size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay cupones activos</h3>
            <p className="text-gray-400 max-w-md mb-6">
              Vuelve pronto para ver nuevos códigos de descuento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
