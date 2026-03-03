import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Ticket } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'
import GenericBanner from '@/components/GenericBanner'

export const dynamic = 'force-dynamic'

export default async function CuponesPage() {
  const supabase = await createClient()

  // Fetch deals with relations
  const now = new Date().toISOString()
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
    .eq('deal_type', 'coupon')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
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
