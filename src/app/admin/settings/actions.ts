'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await (supabase.from('users') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  if ((data as any)?.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return supabase
}

export async function addReferralPattern(pattern: string, description: string) {
  const supabase = await checkAdmin()
  
  const { error } = await (supabase.from('referral_patterns') as any).insert({
    pattern,
    description,
    is_active: true
  })

  if (error) throw new Error(error.message)

  await (supabase.from('moderation_logs') as any).insert({
    action_type: 'add_referral_pattern',
    target_type: 'pattern',
    details: { pattern }
  })

  revalidatePath('/admin/settings')
}

export async function deleteReferralPattern(id: string) {
  const supabase = await checkAdmin()

  const { error } = await (supabase.from('referral_patterns') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/settings')
}

export async function addForbiddenWord(word: string) {
  const supabase = await checkAdmin()

  const { error } = await (supabase.from('forbidden_words') as any).insert({
    word: word.toLowerCase().trim(),
  })

  if (error) throw new Error(error.message)

  await (supabase.from('moderation_logs') as any).insert({
    action_type: 'add_forbidden_word',
    target_type: 'word',
    details: { word }
  })

  revalidatePath('/admin/settings')
}

export async function deleteForbiddenWord(id: string) {
  const supabase = await checkAdmin()

  const { error } = await (supabase.from('forbidden_words') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings')
}