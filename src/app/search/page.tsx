import { createClient } from '@/lib/supabase/server'
import DealCard from '@/components/DealCard'
import { Deal } from '@/types'
import { Search } from 'lucide-react'
import HomeFilters from '@/components/HomeFilters'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const query = params.q || ''

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <Search className="w-16 h-16 text-zinc-700 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Busca ofertas increíbles</h1>
        <p className="text-zinc-400">Ingresa un término de búsqueda para comenzar.</p>
      </div>
    )
  }

  // 1. Get matching stores
  const { data: stores } = await supabase
    .from('stores')
    .select('id')
    .ilike('name', `%${query}%`)
  
  const storeIds = stores?.map(s => s.id) || []
  
  // 2. Get matching categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', `%${query}%`)
    
  const categoryIds = categories?.map(c => c.id) || []
  
  // 3. Build OR query
  let orQuery = `title.ilike.%${query}%,description.ilike.%${query}%`
  
  if (storeIds.length > 0) {
    orQuery += `,store_id.in.(${storeIds.join(',')})`
  }
  
  if (categoryIds.length > 0) {
    orQuery += `,category_id.in.(${categoryIds.join(',')})`
  }

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
    .or(orQuery)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching deals:', error)
  }

  const deals = dealsData?.map(deal => ({
    ...(deal as any),
    comments_count: (deal as any).comments ? ((deal as any).comments as any)[0]?.count : 0
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-[#18191c] border border-[#2d2e33] rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Search className="text-[#2BD45A]" />
          Resultados para "{query}"
        </h1>
        <p className="text-zinc-400 mt-1">
          Se encontraron {deals?.length || 0} resultados
        </p>
      </div>

      <HomeFilters dealsCount={deals?.length || 0} />

      <div className="flex flex-col gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            // @ts-ignore
            <DealCard key={deal.id} deal={deal as unknown as Deal} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin resultados</h3>
            <p className="text-gray-400 max-w-md mb-6">
              No encontramos ofertas que coincidan con tu búsqueda. Intenta con otros términos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
