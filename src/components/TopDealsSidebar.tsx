import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

import { Flame, Tag, ChevronRight } from 'lucide-react'

export default async function TopDealsSidebar() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // 1. Fetch Top 5 Hot Deals
  const { data: hotDeals } = await supabase
    .from('deals')
    .select(`
      id, 
      title, 
      deal_price, 
      original_price, 
      discount_percentage, 
      image_urls, 
      store:stores(name)
    `)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('votes_count', { ascending: false })
    .limit(5)

  // 2. Fetch Top 5 Highest Discounts
  const { data: discountDeals } = await supabase
    .from('deals')
    .select(`
      id, 
      title, 
      deal_price, 
      original_price, 
      discount_percentage, 
      image_urls, 
      store:stores(name)
    `)
    .eq('status', 'active')
    .not('discount_percentage', 'is', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('discount_percentage', { ascending: false })
    .limit(5)

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Gratis'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const renderSmallCard = (deal: any, index: number) => {
    const imageUrl = deal.image_urls?.[0] || null
    
    return (
      <Link 
        key={deal.id} 
        href={`/oferta/${deal.id}`}
        className="flex gap-3 group items-center bg-surface hover:bg-surface-hover p-2 rounded-xl transition-colors border border-transparent hover:border-border"
      >
        <div className="w-[60px] h-[60px] relative bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-border">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={deal.title}
              fill
              className="object-contain p-1 group-hover:scale-110 transition-transform duration-300"
              sizes="60px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <Tag size={16} />
            </div>
          )}
          <div className="absolute top-0 left-0 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg z-10">
            #{index + 1}
          </div>
        </div>

        <div className="flex flex-col min-w-0 flex-1 justify-center h-full">
          <h4 className="text-zinc-900 dark:text-zinc-100 font-bold text-xs line-clamp-2 leading-tight group-hover:text-[#07B5A7] transition-colors">
            {deal.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[#07B5A7] font-black justify-start text-xs tracking-tight">
              {formatPrice(deal.deal_price)}
            </span>
            {deal.discount_percentage && (
              <span className="bg-[#f5cb17] text-zinc-900 text-[9px] font-black px-1 rounded-sm">
                -{deal.discount_percentage}%
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full relative z-10 sticky top-[100px]">
      
      {/* 1. Hot Deals Section */}
      {hotDeals && hotDeals.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-3 border-b border-border flex items-center gap-2">
            <Flame className="text-orange-500 fill-orange-500/20" size={18} />
            <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
              Top 🔥
            </h3>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {hotDeals.map((deal, index) => renderSmallCard(deal, index))}
          </div>
        </div>
      )}



      {/* 3. High Discount Section */}
      {discountDeals && discountDeals.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-3 border-b border-border flex items-center gap-2">
            <Tag className="text-blue-500 fill-blue-500/20" size={18} />
            <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
              + Descuento
            </h3>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {discountDeals.map((deal, index) => renderSmallCard(deal, index))}
          </div>
        </div>
      )}

    </div>
  )
}
