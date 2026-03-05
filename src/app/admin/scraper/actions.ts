'use server'

import { createClient } from '@/lib/supabase/server'
import { searchMercadoLibre, searchAmazon, scrapeAmazonUrl, scrapeMercadoLibreUrl, ScrapedDeal } from '@/lib/scraper'
import { revalidatePath } from 'next/cache'

async function logScraperAction(operation: 'search' | 'url_scrape' | 'publish', source: string | null, status: 'success' | 'error', details: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.from('scraper_logs').insert({
      operation,
      source,
      status,
      details,
      user_id: user.id
    })
  }
}

async function checkPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, user: null }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  
  const authorized = userData && (userData.role === 'admin' || userData.role === 'moderator')
  return { authorized, user }
}

export async function searchDeals(query: string, source: string) {
  const { authorized } = await checkPermissions()
  if (!authorized) throw new Error('Unauthorized')

  try {
    let results: ScrapedDeal[] = []
    if (source === 'mercadolibre') {
      results = await searchMercadoLibre(query)
    } else if (source === 'amazon') {
      results = await searchAmazon(query)
    }

    await logScraperAction('search', source, 'success', { query, count: results.length })
    return results
  } catch (error) {
    console.error('Search error:', error)
    await logScraperAction('search', source, 'error', { query, error: String(error) })
    return []
  }
}

export async function scrapeUrl(url: string, source: 'mercadolibre' | 'amazon') {
  const { authorized } = await checkPermissions()
  if (!authorized) return { error: 'No autorizado' }

  try {
    let deal: ScrapedDeal | null = null
    if (source === 'mercadolibre') {
      deal = await scrapeMercadoLibreUrl(url)
    } else if (source === 'amazon') {
      deal = await scrapeAmazonUrl(url)
    }

    if (deal) {
      await logScraperAction('url_scrape', source, 'success', { url, deal_id: deal.id })
      return { success: true, deal }
    } else {
      await logScraperAction('url_scrape', source, 'error', { url, error: 'Not found or parse error' })
      return { error: 'No se pudo extraer información de la URL. Verifica que sea válida.' }
    }
  } catch (error) {
    console.error('Scrape URL error:', error)
    await logScraperAction('url_scrape', source, 'error', { url, error: String(error) })
    return { error: 'Error al procesar la URL' }
  }
}

export async function publishDeal(deal: ScrapedDeal, categoryId: string) {
  const { authorized, user } = await checkPermissions()
  if (!authorized || !user) return { error: 'No tienes permisos para realizar esta acción' }

  // Calculate discount percentage
  let discount_percentage = null
  if (deal.original_price && deal.original_price > deal.price) {
    discount_percentage = Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
  }

  const supabase = await createClient()

  // 1. Save to scraped_deals (history)
  // We use raw_data to store the full structured shipping info if needed, but since we added shipping_info to ScrapedDeal,
  // we might want to store it explicitly.
  // The 'raw_data' field in table is JSONB, so we can merge shipping_info into it or just store deal.raw_data which comes from the API/Scraper.
  // Ideally, we should update the table schema to have a 'shipping_info' column, but for now we can put it in raw_data or just rely on description.
  // Wait, I created scraped_deals with raw_data JSONB. I can put the whole deal object there or just the raw API response.
  // Let's stick to current implementation but ensure shipping info is part of the metadata if we want to query it later.
  // I will update the raw_data to include our enhanced shipping info.
  
  const enrichedRawData = {
    ...deal.raw_data,
    shipping_info: deal.shipping_info
  }

  const { error: scrapeError } = await supabase.from('scraped_deals').upsert({
    external_id: deal.id,
    source: deal.source,
    title: deal.title,
    price: deal.price,
    original_price: deal.original_price,
    currency: deal.currency || 'MXN',
    image_url: deal.image_url,
    url: deal.url,
    description: deal.description,
    status: 'published',
    raw_data: enrichedRawData
  }, { onConflict: 'source, external_id' })

  if (scrapeError) {
    console.error('Error saving to scraped_deals:', scrapeError)
  }

  // 2. Insert into deals (Public)
  // We can append shipping info to description or use it to populate shipping_cost
  let descriptionWithShipping = deal.description;
  const shippingDetails = [];
  if (deal.shipping_info) {
      if (deal.shipping_info.has_prime) shippingDetails.push('Prime');
      if (deal.shipping_info.has_meli_plus) shippingDetails.push('Meli+');
      if (deal.shipping_info.is_full) shippingDetails.push('Full');
      if (deal.shipping_info.free_shipping_label) shippingDetails.push('Envío Gratis');
      if (deal.shipping_info.shipping_text) shippingDetails.push(deal.shipping_info.shipping_text);
  }
  if (deal.payment_info?.has_msi) {
      shippingDetails.push('Meses sin intereses');
  }

  if (shippingDetails.length > 0) {
      descriptionWithShipping += `\n\n**Detalles:** ${shippingDetails.join(', ')}.`;
  }

  // Get Store ID based on source
  // We need to map scraper source to store_id in DB.
  // Assuming we have stores 'Amazon' and 'Mercado Libre' in DB.
  let storeId = null;
  const storeNameSearch = deal.source === 'mercadolibre' ? 'Mercado Libre' : 'Amazon';
  
  const { data: storeData } = await supabase
    .from('stores')
    .select('id')
    .ilike('name', `%${storeNameSearch}%`)
    .limit(1)
    .maybeSingle();
  
  if (storeData) {
      storeId = storeData.id;
  }

  const { error } = await supabase.from('deals').insert({
    user_id: user.id,
    title: deal.title,
    description: descriptionWithShipping,
    deal_price: deal.price,
    original_price: deal.original_price,
    discount_percentage,
    deal_url: deal.url,
    image_urls: deal.image_urls && deal.image_urls.length > 0 ? deal.image_urls : [deal.image_url],
    category_id: categoryId,
    store_id: storeId, // Link to store
    status: 'active',
    deal_type: 'deal',
    availability: deal.availability || 'online',
    shipping_country: 'MX',
    shipping_cost: deal.shipping_info?.shipping_cost || (deal.shipping_info?.free_shipping_label ? 0 : null),
    expires_at: deal.expires_at, // Remove default fallback
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
    moderation_notes: `Auto-published from ${deal.source} scraper. Shipping: ${JSON.stringify(deal.shipping_info)}`
  })

  if (error) {
    console.error('Error publishing deal:', error)
    await logScraperAction('publish', deal.source, 'error', { deal_id: deal.id, error: String(error) })
    return { error: 'Error al publicar la oferta' }
  }

  await logScraperAction('publish', deal.source, 'success', { deal_id: deal.id, title: deal.title })

  revalidatePath('/deals')
  revalidatePath('/admin/scraper')
  return { success: true }
}

export async function getScraperLogs() {
  const { authorized } = await checkPermissions()
  if (!authorized) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('scraper_logs')
    .select('*, users(username, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  return data || []
}
