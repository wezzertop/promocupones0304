'use server'

import { createClient } from '@/lib/supabase/server'
import { searchMercadoLibre, searchAmazon, ScrapedDeal } from '@/lib/scraper'
import { revalidatePath } from 'next/cache'

export async function searchDeals(query: string, source: string) {
  if (source === 'mercadolibre') {
    return await searchMercadoLibre(query)
  } else if (source === 'amazon') {
    return await searchAmazon(query)
  }
  return []
}

export async function publishDeal(deal: ScrapedDeal, categoryId: string) {
  const supabase = await createClient()
  
  // Get current user (admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Check if admin
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || userData.role !== 'admin') {
    return { error: 'No tienes permisos de administrador' }
  }

  // Calculate discount percentage
  let discount_percentage = null
  if (deal.original_price && deal.original_price > deal.price) {
    discount_percentage = Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
  }

  // Insert Deal
  const { error } = await supabase.from('deals').insert({
    user_id: user.id,
    title: deal.title,
    description: deal.description,
    deal_price: deal.price,
    original_price: deal.original_price,
    discount_percentage,
    deal_url: deal.url,
    image_urls: [deal.image_url],
    category_id: categoryId,
    status: 'active', // Auto-approve since admin posted it
    deal_type: 'deal',
    availability: 'online',
    shipping_country: 'MX'
  })

  if (error) {
    console.error('Error publishing deal:', error)
    return { error: 'Error al publicar la oferta' }
  }

  revalidatePath('/deals')
  return { success: true }
}
