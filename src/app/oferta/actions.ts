'use server'

import { createClient } from '@/lib/supabase/server'
import { dealSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkForbiddenWords, isReferralUrl, canUserPostReferral } from '@/lib/moderation'

export async function updateDeal(dealId: string, prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  // 2. Extract Data
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    price: Number(formData.get('price')),
    original_price: formData.get('original_price') ? Number(formData.get('original_price')) : null,
    url: formData.get('url'),
    category_id: formData.get('category_id'),
    coupon_code: formData.get('coupon_code') || null,
    availability: formData.get('availability') || null,
    shipping_cost: Number(formData.get('shipping_cost') || 0),
    shipping_country: formData.get('shipping_country') || null,
    start_date: formData.get('start_date') || null,
    expires_at: formData.get('expires_at') || null,
    image_urls: JSON.parse(formData.get('image_urls') as string || '[]'),
  }

  // 3. Validate with Zod
  const validatedFields = dealSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const data = validatedFields.data

  // 4. Moderation Checks (Server-side)
  // Forbidden Words
  const titleCheck = await checkForbiddenWords(data.title)
  if (titleCheck.hasForbidden) return { error: `Título contiene palabra prohibida: ${titleCheck.word}` }
  
  const descCheck = await checkForbiddenWords(data.description)
  if (descCheck.hasForbidden) return { error: `Descripción contiene palabra prohibida: ${descCheck.word}` }

  // Referral Check
  const referralCheck = await isReferralUrl(data.url)
  if (referralCheck.isReferral) {
    const canPost = await canUserPostReferral(user.id)
    if (!canPost) return { error: `No puedes publicar referidos. ${referralCheck.reason}` }
  }

  // 5. Check Ownership & Permissions
  // We fetch the existing deal to check owner
  const { data: existingDeal, error: fetchError } = await supabase
    .from('deals')
    .select('user_id, status')
    .eq('id', dealId)
    .single()

  if (fetchError || !existingDeal) return { error: 'Oferta no encontrada' }

  // Check if user is admin/mod
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isStaff = ['admin', 'moderator'].includes((userData as any)?.role || '')

  if ((existingDeal as any).user_id !== user.id && !isStaff) {
    return { error: 'No tienes permiso para editar esta oferta' }
  }

  // 6. Update Deal
  // Calculate discount
  let discount_percentage = null
  if (data.original_price && data.original_price > data.price) {
    discount_percentage = Math.round(((data.original_price - data.price) / data.original_price) * 100)
  }

  // Determine status (reset to pending if normal user)
  const status = isStaff ? 'active' : 'pending'

  const { error: updateError } = await (supabase.from('deals') as any)
    .update({
      title: data.title,
      description: data.description,
      deal_price: data.price,
      original_price: data.original_price,
      discount_percentage,
      deal_url: data.url,
      category_id: data.category_id,
      image_urls: data.image_urls,
      coupon_code: data.coupon_code,
      availability: data.availability,
      shipping_cost: data.shipping_cost,
      shipping_country: data.shipping_country,
      start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      status: status, // Trigger will also enforce this, but good to be explicit
      updated_at: new Date().toISOString()
    })
    .eq('id', dealId)

  if (updateError) {
    return { error: `Error al actualizar: ${updateError.message}` }
  }

  revalidatePath(`/oferta/${dealId}`)
  revalidatePath('/')
  
  return { success: true }
}
